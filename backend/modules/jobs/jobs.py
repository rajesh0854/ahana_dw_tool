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


# get hob schedule details
@jobs_bp.route('/get_job_schedule_details/<job_flow_id>', methods=['GET'])
def get_job_schedule_details(job_flow_id):
    try:
        conn = create_oracle_connection()
        query = "SELECT JOBFLWID,MAPREF,FRQCD,FRQDD,FRQHH,FRQMI,STRTDT,ENDDT,STFLG,DPND_JOBSCHID, RECCRDT,RECUPDT FROM DWJOBSCH WHERE CURFLG ='Y' AND JOBFLWID=:job_flow_id"
        cursor = conn.cursor()
        cursor.execute(query, {'job_flow_id': job_flow_id})
        job_schedule_details = cursor.fetchall()
        return jsonify(job_schedule_details)
    except Exception as e:
        return jsonify({"error": str(e)}), 500





