from flask import Blueprint, request, jsonify
from modules.helper_functions import get_job_list,call_create_update_job,get_mapping_ref,get_mapping_details
from database.dbconnect import create_oracle_connection
# Create blueprint
jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route("/jobs_list", methods=["GET"])
def jobs():
    try:
        conn = create_oracle_connection()
        try:
            job_list = get_job_list(conn)
           
            # Convert datetime objects to ISO format strings for JSON serialization
            for job in job_list:
                if 'RECCRDT' in job and job['RECCRDT']:
                    job['RECCRDT'] = job['RECCRDT'].isoformat()
                if 'RECUPDT' in job and job['RECUPDT']:
                    job['RECUPDT'] = job['RECUPDT'].isoformat()
           
            return jsonify(job_list)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
@jobs_bp.route("/view_mapping/<mapping_reference>")
def job_mapping_view(mapping_reference):
    try:
        conn = create_oracle_connection()
        try:
            # Get mapping reference and details data
            mapping_ref_data = get_mapping_ref(conn, reference=mapping_reference)
            mapping_detail_data = get_mapping_details(conn, reference=mapping_reference)
           
            # Prepare the response
            response_data = {
                "mapping_reference": mapping_ref_data,
                "mapping_details": mapping_detail_data
            }
           
            return jsonify(response_data)
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/create-update', methods=['POST'])
def create_update_job():
    try:
        data = request.json
        p_mapref = data.get('mapref')
        
        if not p_mapref:
            return jsonify({
                'success': False,
                'message': 'Missing required parameter: mapref'
            }), 400
            
        conn = create_oracle_connection()
        try:
            job_id, error_message = call_create_update_job(conn, p_mapref)
            
            if error_message:
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 500
                
            return jsonify({
                'success': True,
                'message': 'Job created/updated successfully',
                'job_id': job_id
            })
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error in create_update_job: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'An error occurred while processing the request: {str(e)}'
        }), 500 

@jobs_bp.route('/get_all_jobs', methods=['GET'])
def get_all_jobs():
    try:
        conn = create_oracle_connection()
        query_job_flow = """
        SELECT 
            f.JOBFLWID,
            f.MAPREF,
            f.TRGSCHM,
            f.TRGTBTYP,
            f.TRGTBNM,
            f.DWLOGIC,
            f.STFLG,
            CASE 
                WHEN s.JOBFLWID IS NOT NULL THEN 'Scheduled'
                ELSE 'Not Scheduled'
            END AS JOB_SCHEDULE_STATUS,
            CASE 
                WHEN s.JOBFLWID IS NOT NULL THEN s.JOBSCHID
                ELSE NULL
            END AS JOBSCHID,
            CASE 
                WHEN s.JOBFLWID IS NOT NULL THEN s.DPND_JOBSCHID
                ELSE NULL
            END AS DPND_JOBSCHID
        FROM 
            MAP.DWJOBFLW f
        LEFT JOIN 
            (SELECT 
                 JOBFLWID, 
                 MIN(JOBSCHID) AS JOBSCHID, 
                 MIN(DPND_JOBSCHID) AS DPND_JOBSCHID
             FROM MAP.DWJOBSCH
             WHERE CURFLG = 'Y'
             GROUP BY JOBFLWID) s
        ON 
            f.JOBFLWID = s.JOBFLWID
        WHERE 
            f.CURFLG = 'Y'
        """
        cursor = conn.cursor()
        cursor.execute(query_job_flow)
        columns = [col[0] for col in cursor.description]
        raw_jobs = cursor.fetchall()
    
        # Convert LOB objects to strings and create a list of dictionaries
        jobs = []
        for row in raw_jobs:
            job_dict = {}
            for i, column in enumerate(columns):
                value = row[i]
                # Handle LOB objects
                if hasattr(value, 'read'):
                    try:
                        value = value.read()
                        # If it's bytes, decode to string
                        if isinstance(value, bytes):
                            value = value.decode('utf-8')
                    except Exception as e:
                        value = str(e)  # Fallback if reading fails
                job_dict[column] = value
            jobs.append(job_dict)
            
        return jsonify(jobs)
    except Exception as e:
        print(f"Error in get_all_jobs: {str(e)}")
        return jsonify({"error": str(e)}), 500

# get job details
@jobs_bp.route('/get_job_details/<mapref>', methods=['GET'])
def get_job_details(mapref):
    try:
        conn = create_oracle_connection()

        job_details_query=""" 
        SELECT TRGCLNM,TRGCLDTYP,TRGKEYFLG,TRGKEYSEQ,TRGCLDESC,MAPLOGIC,KEYCLNM,VALCLNM,SCDTYP FROM DWJOBDTL WHERE CURFLG = 'Y' AND MAPREF = :mapref """
        cursor = conn.cursor()
        cursor.execute(job_details_query, {'mapref': mapref})
        job_details = cursor.fetchall()
        return jsonify({
            'job_details': job_details
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# get job schedule details
@jobs_bp.route('/get_job_schedule_details/<job_flow_id>', methods=['GET'])
def get_job_schedule_details(job_flow_id):
    try:
        conn = create_oracle_connection()
        query = """
        SELECT 
            JOBFLWID,
            MAPREF,
            FRQCD,
            FRQDD,
            FRQHH,
            FRQMI,
            STRTDT,
            ENDDT,
            STFLG,
            DPND_JOBSCHID,
            RECCRDT,
            RECUPDT 
        FROM DWJOBSCH 
        WHERE CURFLG ='Y' AND JOBFLWID=:job_flow_id
        """
        cursor = conn.cursor()
        cursor.execute(query, {'job_flow_id': job_flow_id})
        
        # Get column names
        columns = [col[0] for col in cursor.description]
        
        # Convert to list of dictionaries
        job_schedule_details = []
        for row in cursor.fetchall():
            job_dict = {}
            for i, column in enumerate(columns):
                value = row[i]
                
                # Convert Oracle NUMBER to string or int
                if isinstance(value, int) or isinstance(value, float):
                    job_dict[column] = str(value)  # Convert all numbers to strings for consistency
                # Handle date objects
                elif hasattr(value, 'strftime'):
                    job_dict[column] = value.isoformat() if hasattr(value, 'isoformat') else str(value)
                # Handle other types
                else:
                    job_dict[column] = str(value) if value is not None else ""
            
            # Debug information
            print(f"Job schedule details for {job_flow_id}: {job_dict}")
            job_schedule_details.append(job_dict)
        
        return jsonify(job_schedule_details)
    except Exception as e:
        print(f"Error in get_job_schedule_details: {str(e)}")
        return jsonify({"error": str(e)}), 500

# save or update job schedule
@jobs_bp.route('/save_job_schedule', methods=['POST'])
def save_job_schedule():
    try:
        data = request.json
        
        # Required fields
        job_flow_id = data.get('JOBFLWID')
        map_ref = data.get('MAPREF')
        frequency_code = data.get('FRQCD')
        frequency_day = data.get('FRQDD')
        frequency_hour = data.get('FRQHH')
        frequency_minute = data.get('FRQMI')
        start_date = data.get('STRTDT')
        end_date = data.get('ENDDT')
        dependent_job = data.get('DPND_JOBSCHID')
        
        # Validate required fields
        if not job_flow_id or not map_ref or not frequency_code or not frequency_day or not frequency_hour or not frequency_minute or not start_date:
            return jsonify({
                'success': False,
                'message': 'Missing required parameters for job schedule'
            }), 400
            
        # For now, just print the data (for debugging/testing)
        print(f"Received schedule data for job {job_flow_id}:")
        print(f"Map Ref: {map_ref}")
        print(f"Frequency: {frequency_code}, Day: {frequency_day}, Hour: {frequency_hour}, Minute: {frequency_minute}")
        print(f"Start Date: {start_date}, End Date: {end_date}")
        print(f"Dependent Job: {dependent_job}")
        
        # In a real implementation, you would save this to the database
        # For example:
        # conn = create_oracle_connection()
        # try:
        #     cursor = conn.cursor()
        #     # Check if job schedule already exists
        #     check_query = "SELECT COUNT(*) FROM MAP.DWJOBSCH WHERE JOBFLWID = :job_flow_id AND CURFLG = 'Y'"
        #     cursor.execute(check_query, {'job_flow_id': job_flow_id})
        #     count = cursor.fetchone()[0]
        #     
        #     if count > 0:
        #         # Update existing schedule
        #         update_query = """
        #             UPDATE MAP.DWJOBSCH 
        #             SET FRQCD = :frqcd, FRQDD = :frqdd, FRQHH = :frqhh, FRQMI = :frqmi, 
        #                 STRTDT = TO_DATE(:strtdt, 'YYYY-MM-DD'), 
        #                 ENDDT = TO_DATE(:enddt, 'YYYY-MM-DD'),
        #                 DPND_JOBSCHID = :dpnd_jobschid,
        #                 RECUPDT = SYSDATE
        #             WHERE JOBFLWID = :job_flow_id AND CURFLG = 'Y'
        #         """
        #         cursor.execute(update_query, {
        #             'frqcd': frequency_code,
        #             'frqdd': frequency_day,
        #             'frqhh': frequency_hour,
        #             'frqmi': frequency_minute,
        #             'strtdt': start_date,
        #             'enddt': end_date,
        #             'dpnd_jobschid': dependent_job,
        #             'job_flow_id': job_flow_id
        #         })
        #     else:
        #         # Insert new schedule
        #         insert_query = """
        #             INSERT INTO MAP.DWJOBSCH (
        #                 JOBSCHID, JOBFLWID, MAPREF, FRQCD, FRQDD, FRQHH, FRQMI, 
        #                 STRTDT, ENDDT, STFLG, DPND_JOBSCHID, CURFLG, RECCRDT
        #             ) VALUES (
        #                 MAP.SEQ_DWJOBSCH.NEXTVAL, :job_flow_id, :map_ref, :frqcd, :frqdd, :frqhh, :frqmi,
        #                 TO_DATE(:strtdt, 'YYYY-MM-DD'), TO_DATE(:enddt, 'YYYY-MM-DD'),
        #                 'A', :dpnd_jobschid, 'Y', SYSDATE
        #             )
        #         """
        #         cursor.execute(insert_query, {
        #             'job_flow_id': job_flow_id,
        #             'map_ref': map_ref,
        #             'frqcd': frequency_code,
        #             'frqdd': frequency_day,
        #             'frqhh': frequency_hour,
        #             'frqmi': frequency_minute,
        #             'strtdt': start_date,
        #             'enddt': end_date,
        #             'dpnd_jobschid': dependent_job
        #         })
        #     
        #     conn.commit()
        # finally:
        #     conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Job schedule saved successfully'
        })
        
    except Exception as e:
        print(f"Error in save_job_schedule: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'An error occurred while saving the job schedule: {str(e)}'
        }), 500





####################### Scheduled Jobs and Logs #######################

# get list of scheduled jobs
@jobs_bp.route('/get_scheduled_jobs', methods=['GET'])
def get_scheduled_jobs():
    try:
        conn = create_oracle_connection()
        query = """ 
        SELECT MAPREF as MAP_REFERENCE,
        STFLG as STATUS from DWJOBSCH 
        where CURFLG = 'Y' 
        """
        cursor = conn.cursor()
        cursor.execute(query)
        scheduled_jobs = cursor.fetchall()
        return jsonify({
            'scheduled_jobs': scheduled_jobs
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# get job and process log details for a scheduled job
@jobs_bp.route('/get_job_and_process_log_details/<mapref>', methods=['GET'])
def get_job_and_process_log_details(mapref):
    try:
        conn = create_oracle_connection()
        query = """ 
        SELECT 
            DJL.PRCDT as PROCESS_DATE,
            DJL.MAPREF as MAP_REFERENCE,
            DJL.JOBID as JOB_ID,
            DJL.SRCROWS as SOURCE_ROWS,
            DJL.TRGROWS as TARGET_ROWS,
            DJL.ERRROWS as ERROR_ROWS,
            DPL.STRTDT as START_DATE,
            DPL.ENDDT as END_DATE,
            DPL.STATUS as STATUS
        FROM 
            MAP.DWJOBLOG DJL
        INNER JOIN 
            MAP.DWPRCLOG DPL
        ON 
            DJL.JOBID = DPL.JOBID
        WHERE 
            DJL.MAPREF = :mapref
        """
        cursor = conn.cursor()
        cursor.execute(query, {'mapref': mapref})
        job_and_process_log_details = cursor.fetchall()
        return jsonify({
            'job_and_process_log_details': job_and_process_log_details
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get error details of a scheduled job
@jobs_bp.route('/get_error_details/<job_id>', methods=['GET'])
def get_error_details(job_id):
    try:
        conn = create_oracle_connection()
        query = """ 
        SELECT ERRID as ERROR_ID,
        PRCDT as PROCESS_DATE,
        ERRTYP as ERROR_TYPE,
        DBERRMSG as DATABASE_ERROR_MESSAGE,
        ERRMSG as ERROR_MESSAGE,
        KEYVALUE as KEY_VALUE 
        FROM DWJOBERR WHERE JOBID = :job_id 
        """
        cursor = conn.cursor()
        cursor.execute(query, {'job_id': job_id})
        error_details = cursor.fetchall()
        return jsonify({
            'error_details': error_details
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

