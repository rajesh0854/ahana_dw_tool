from flask import Blueprint, request, jsonify
from database.dbconnect import create_oracle_connection

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)


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
        return jsonify(rows)
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
        return jsonify(rows)    
    except Exception as e:
        return jsonify({"error": str(e)}), 500  



