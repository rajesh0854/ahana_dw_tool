import oracledb

def get_job_list(conn):
    try:
        cursor = conn.cursor()
        query = "SELECT JOBID, MAPID, MAPREF, FRQCD, TRGSCHM, TRGTBTYP, TRGTBNM, SRCSYSTM, STFLG, RECCRDT, RECUPDT, CURFLG, BLKPRCROWS FROM DWJOB"
        cursor.execute(query)
        
        # Get column names from cursor description
        columns = [col[0] for col in cursor.description]
        
        # Fetch all rows and convert to dictionaries
        result = []
        for row in cursor.fetchall():
            result.append(dict(zip(columns, row)))
            
        cursor.close()
        return result
    except Exception as e:
        print(f"Error fetching job list: {str(e)}")
        raise


def call_create_update_job(connection, p_mapref):
    """
    Calls the Oracle function CREATE_UPDATE_JOB
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference to create/update job
    
    Returns:
        tuple: A tuple containing (job_id, error_message) where:
            - job_id: The returned job ID from the function
            - error_message: Any error message returned by the Oracle function
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameter for job_id
        v_job_id = cursor.var(oracledb.NUMBER)  # Assuming jobid is a NUMBER in Oracle
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :job_id := MAP.PKGDWJOB.CREATE_UPDATE_JOB(
                p_mapref => :p_mapref
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            job_id=v_job_id,
            p_mapref=p_mapref
        )
        connection.commit()
        
        # Get the result
        job_id = v_job_id.getvalue()
        
        return job_id, None
    
    except Exception as e:
        error_message = f"Error creating/updating job: {str(e)}"
        print(error_message)
        return None, error_message
    
    finally:
        if cursor:
            cursor.close()

