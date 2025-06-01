from flask import Blueprint, request, jsonify
from database.dbconnect import create_oracle_connection
import os
import dotenv
import json
from decimal import Decimal
from datetime import timedelta

dotenv.load_dotenv()

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)
SCHEMA=os.getenv("SCHEMA")

def convert_to_serializable(obj):
    """Convert Oracle objects to JSON serializable format"""
    if isinstance(obj, timedelta):
        # Convert timedelta to total seconds
        return obj.total_seconds()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif hasattr(obj, 'isoformat'):  # datetime objects
        return obj.isoformat()
    return obj

def process_rows(rows):
    """Process database rows to make them JSON serializable"""
    processed_rows = []
    for row in rows:
        processed_row = []
        for item in row:
            processed_row.append(convert_to_serializable(item))
        processed_rows.append(processed_row)
    return processed_rows

@dashboard_bp.route("/all_metrics", methods=["GET"])
def all_metrics():
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=""" 
        select count(m.mapref) total_mappings
              ,sum(case when m.lgvrfyflg = 'Y' then 1 else 0 end) logic_verified
              ,sum(case when m.stflg = 'A' then 1 else 0 end) active_mappings
              ,sum(case when j.mapref is not null then 1 else 0 end) total_jobs
              ,sum(case when j.stflg = 'A' then 1 else 0 end) Active_jobs
              ,sum(case when f.mapref is not null then 1 else 0 end) job_flow_created
              ,sum(case when s.mapref is not null then 1 else 0 end) schedule_created
        from dwmapr m, dwjob j, dwjobflw f, dwjobsch s
        where m.curflg = 'Y'
        and   j.mapref (+) = m.mapref
        and   j.curflg (+) = m.curflg
        and   f.mapref (+) = j.mapref
        and   f.jobid (+) = j.jobid
        and   f.curflg (+) = 'Y'
        and   s.jobflwid (+) = f.jobflwid
        and   s.curflg (+) = 'Y'
    """

    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))
    except Exception as e:
        return jsonify({"error": str(e)}), 500  
    


@dashboard_bp.route("/jobs_overview", methods=["GET"])
def jobs_overview():
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=""" 
        select l.mapref, count(l.mapref) times_processed, avg(l.srcrows) average_src_rows_processed, ceil(avg(l.trgrows)) average_trg_rows_processed
              ,max(enddt - strtdt) Max_job_duration, min(enddt - strtdt) Min_job_duration
        from  dwjoblog l, dwprclog p
        where p.jobid (+) = l.jobid
        group by l.mapref
 
        """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))    
    except Exception as e:
        return jsonify({"error": str(e)}), 500  




# jobs and procssed source and target rows
@dashboard_bp.route("/jobs_processed_rows", methods=["GET"])
def jobs_processed_rows():
    mapref = request.args.get('mapref')
    period = request.args.get('period', 'DAY')
    
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=""" 
        SELECT 
            MAPREF,
            TO_CHAR(TRUNC(PRCDT), 'YYYY-MM-DD') AS TIME_GROUP,
            SUM(SRCROWS) AS TOTAL_SRCROWS,
            SUM(TRGROWS) AS TOTAL_TRGROWS
        FROM DWJOBLOG
        WHERE MAPREF = :mapref
          AND PRCDT >= 
              CASE :period
                  WHEN 'DAY' THEN TRUNC(SYSDATE)
                  WHEN 'WEEK' THEN TRUNC(SYSDATE) - 6
                  WHEN 'MONTH' THEN TRUNC(SYSDATE) - 29
              END
        GROUP BY MAPREF, TO_CHAR(TRUNC(PRCDT), 'YYYY-MM-DD')
        ORDER BY TIME_GROUP
        """
    try:
        cursor.execute(query, (mapref, period))
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# jobs and executed duration - day/week/month
@dashboard_bp.route("/jobs_executed_duration", methods=["GET"])
def jobs_executed_duration():
    mapref = request.args.get('mapref')
    period = request.args.get('period', '1')
    
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=f""" 
        select
            substr(l.job_name, 1, instr(l.job_name, '_', -1) - 1) as job_name_no_ts,
            (extract(day from ld.run_duration) * 86400 +
             extract(hour from ld.run_duration) * 3600 +
             extract(minute from ld.run_duration) * 60 +
             extract(second from ld.run_duration)) as run_duration_seconds
        from
            all_scheduler_job_log l,
            all_scheduler_job_run_details ld
        where
            ld.owner = l.owner
            and ld.log_id = l.log_id
            and l.owner = '{SCHEMA}'
            and l.status = 'SUCCEEDED'
            and substr(l.job_name, 1, instr(l.job_name, '_', -1) - 1) = :mapref
            and l.log_date >= sysdate - :period
        order by
            l.log_date desc
        """
    try:
        cursor.execute(query, (mapref, period))
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))    
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# jobs and average run duration
@dashboard_bp.route("/jobs_average_run_duration", methods=["GET"])
def jobs_average_run_duration():
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=f""" 
        SELECT JOB_NAME, AVG(avg_seconds) as AVG_SECONDS from(
        select substr(job_name, 1, instr(job_name, '_', -1) - 1) as JOB_NAME,
        ROUND(AVG(
            EXTRACT(DAY FROM RUN_DURATION) * 86400 +
            EXTRACT(HOUR FROM RUN_DURATION) * 3600 +
            EXTRACT(MINUTE FROM RUN_DURATION) * 60 +
            EXTRACT(SECOND FROM RUN_DURATION)
          ),2) AS avg_seconds
        from all_scheduler_job_run_details
        where STATUS='SUCCEEDED' and OWNER='{SCHEMA}'
        group by job_name)
        group by JOB_NAME
        """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# jobs and number of times successful and failed
@dashboard_bp.route("/jobs_successful_failed", methods=["GET"])
def jobs_successful_failed():
    connection = create_oracle_connection()
    cursor = connection.cursor()
    query=f""" 
        select 
            job_name_prefix,
            sum(failed_count) as failed_count,
            sum(succeeded_count) as succeeded_count
        from (
            select 
                substr(job_name, 1, instr(job_name, '_', -1) - 1) as job_name_prefix,
                case when status = 'FAILED' then 1 else 0 end as failed_count,
                case when status = 'SUCCEEDED' then 1 else 0 end as succeeded_count
            from 
                all_scheduler_job_log
            where 
                owner = '{SCHEMA}'
        )
        group by job_name_prefix
        """ 
    try:
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(process_rows(rows))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

