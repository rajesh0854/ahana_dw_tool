
import oracledb

def get_parameter_mapping(conn):
    try:
        cursor = conn.cursor()
        query = "SELECT PRTYP, PRCD, PRDESC, PRVAL, PRRECCRDT, PRRECUPDT FROM DWPARAMS"
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
        print(f"Error fetching parameter mapping: {str(e)}")
        raise

def add_parameter_mapping(conn, type, code, desc, value):
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO DWPARAMS (PRTYP, PRCD, PRDESC, PRVAL, PRRECCRDT, PRRECUPDT)
            VALUES (:1, :2, :3, :4, sysdate, sysdate)
        """
        cursor.execute(query, [type, code, desc, value])
        conn.commit()
        cursor.close()
        return "Parameter mapping added successfully."
    except Exception as e:
        print(f"Error adding parameter mapping: {str(e)}")
        raise

def get_mapping_ref(conn, reference):
    """Fetch reference data from DWMAPR table"""
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                MAPID, MAPREF, MAPDESC, TRGSCHM, TRGTBTYP, 
                TRGTBNM, FRQCD, SRCSYSTM, STFLG, CURFLG, BLKPRCROWS
            FROM DWMAPR 
            WHERE MAPREF = :1 
            AND CURFLG = 'Y'
            AND STFLG = 'A'
        """
        cursor.execute(query, [reference])
        
        # Get column names from cursor description
        columns = [col[0] for col in cursor.description]
        
        # Fetch one row and convert to dictionary
        row = cursor.fetchone()
        result = dict(zip(columns, row)) if row else None
        
        cursor.close()
        return result
    except Exception as e:
        print(f"Error fetching mapping reference: {str(e)}")
        raise

def get_mapping_details(conn, reference):
    """Fetch mapping details from DWMAPRDTL table"""
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                MAPDTLID, MAPREF, TRGCLNM, TRGCLDTYP, TRGKEYFLG, 
                TRGKEYSEQ, TRGCLDESC, MAPLOGIC, KEYCLNM, 
                VALCLNM, MAPCMBCD, EXCSEQ, SCDTYP, LGVRFYFLG
            FROM DWMAPRDTL 
            WHERE MAPREF = :1
            AND CURFLG = 'Y'
            ORDER BY 
                CASE WHEN TRGKEYFLG = 'Y' THEN 0 ELSE 1 END,
                TRGKEYSEQ NULLS LAST,
                TRGCLNM
        """
        cursor.execute(query, [reference])
        
        # Get column names from cursor description
        columns = [col[0] for col in cursor.description]
        
        # Fetch all rows and convert to dictionaries
        result = []
        for row in cursor.fetchall():
            result.append(dict(zip(columns, row)))
            
        cursor.close()
        return result
    except Exception as e:
        print(f"Error fetching mapping details: {str(e)}")
        raise

def get_error_message(conn, map_detail_id):
    """ref: refernece of detail mapping table"""
    try:
        cursor = conn.cursor()
        query = """
            SELECT errmsg FROM DWMAPERR 
            WHERE DWMAPERR.MAPDTLID = :1 
            ORDER BY DWMAPERR.MAPERRID DESC 
            FETCH FIRST 1 ROWS ONLY 
        """
        cursor.execute(query, [map_detail_id])
        
        # Fetch one row
        row = cursor.fetchone()
        
        cursor.close()
        
        if not row:
            return "Logic is Verified"
        
        return row[0]  # Return the first column value
    except Exception as e:
        print(f"Error getting error message: {str(e)}")
        raise

def get_error_messages_list(conn, map_detail_ids):
    """
    map_detail_ids: list of references from detail mapping table
    Returns: dictionary mapping each id to its error message
    """
    try:
        result_dict = {}
        cursor = conn.cursor()
        query = """
            SELECT errmsg FROM DWMAPERR
            WHERE DWMAPERR.MAPDTLID = :1
            ORDER BY DWMAPERR.MAPERRID DESC
            FETCH FIRST 1 ROWS ONLY
        """
       
        for map_detail_id in map_detail_ids:
            cursor.execute(query, [map_detail_id])
           
            # Fetch one row
            row = cursor.fetchone()
           
            if not row:
                result_dict[map_detail_id] = "Logic is Verified"
            else:
                result_dict[map_detail_id] = row[0]  # Return the first column value
       
        cursor.close()
        return result_dict
       
    except Exception as e:
        print(f"Error getting error messages: {str(e)}")
        raise
def get_parameter_mapping_datatype(conn):
    try:
        cursor = conn.cursor()
        query = "SELECT PRCD, PRDESC ,PRVAL FROM DWPARAMS WHERE PRTYP = 'Datatype'"
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
        print(f"Error fetching parameter mapping: {str(e)}")
        raise

def get_parameter_mapping_scd_type(conn):
    try:
        cursor = conn.cursor()
        query = "SELECT PRCD, PRDESC , PRVAL FROM DWPARAMS WHERE PRTYP = 'SCD'"
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
        print(f"Error fetching parameter mapping: {str(e)}")
        raise

def call_activate_deactivate_mapping(connection, p_mapref, p_stflg):
    """
    Calls the Oracle procedure ACTIVATE_DEACTIVATE_MAPPING
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference to activate/deactivate
        p_stflg: Status flag ('A' to activate, 'N' to deactivate)
    
    Returns:
        tuple: A tuple containing (success, message) where:
            - success: Boolean indicating if the operation was successful
            - message: Success or error message
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameter for error message
        p_err = cursor.var(oracledb.STRING, 2000)  # Assuming error message can be up to 2000 chars
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            PKGDWMAPR.ACTIVATE_DEACTIVATE_MAPPING(
                p_mapref => :p_mapref,
                p_stflg => :p_stflg,
                p_err => :p_err
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            p_mapref=p_mapref,
            p_stflg=p_stflg,
            p_err=p_err
        )
        connection.commit()
        
        # Get the error message (if any)
        error_message = p_err.getvalue()
        
        if error_message:
            return False, f"Error: {error_message}"
        else:
            action = "activated" if p_stflg == "A" else "deactivated"
            return True, f"Mapping {p_mapref} successfully {action}"
    
    except Exception as e:
        error_message = f"Exception while activating/deactivating mapping: {str(e)}"
        return False, error_message
    
    finally:
        if cursor:
            cursor.close()

# mapping function

def create_update_mapping(connection, p_mapref, p_mapdesc, p_trgschm, p_trgtbtyp, 
                         p_trgtbnm, p_frqcd, p_srcsystm, p_lgvrfyflg, p_lgvrfydt, p_stflg,p_blkprcrows):
    """
    Creates or updates a mapping using TRG.PKGDWMAPR.CREATE_UPDATE_MAPPING
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference
        p_mapdesc: Mapping description
        p_trgschm: Target schema
        p_trgtbtyp: Target table type
        p_trgtbnm: Target table name
        p_frqcd: Frequency code
        p_srcsystm: Source system
        p_lgvrfyflg: Logic verification flag
        p_lgvrfydt: Logic verification date
        p_stflg: Status flag
        
    Returns:
        Mapping ID
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameter
        v_mapid = cursor.var(oracledb.NUMBER)
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :result := TRG.PKGDWMAPR.CREATE_UPDATE_MAPPING(
                p_mapref => :p_mapref,
                p_mapdesc => :p_mapdesc,
                p_trgschm => :p_trgschm,
                p_trgtbtyp => :p_trgtbtyp,
                p_trgtbnm => :p_trgtbnm,
                p_frqcd => :p_frqcd,
                p_srcsystm => :p_srcsystm,
                p_lgvrfyflg => :p_lgvrfyflg,
                p_lgvrfydt => :p_lgvrfydt,
                p_stflg => :p_stflg,
                p_blkprcrows=>:p_blkprcrows
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            result=v_mapid,
            p_mapref=p_mapref,
            p_mapdesc=p_mapdesc,
            p_trgschm=p_trgschm,
            p_trgtbtyp=p_trgtbtyp,
            p_trgtbnm=p_trgtbnm,
            p_frqcd=p_frqcd,
            p_srcsystm=p_srcsystm,
            p_lgvrfyflg=p_lgvrfyflg,
            p_lgvrfydt=p_lgvrfydt,
            p_stflg=p_stflg,
            p_blkprcrows=p_blkprcrows
        )
        
        connection.commit()
        # Get the result
        mapid = v_mapid.getvalue()

        return mapid
        
    except Exception as e:
        print(f"Error creating/updating mapping: {str(e)}")
        raise
        
    finally:
        if cursor:
            cursor.close()


def create_update_mapping_detail(connection, p_mapref, p_trgclnm, p_trgcldtyp, p_trgkeyflg, 
                               p_trgkeyseq, p_trgcldesc, p_maplogic, p_keyclnm, 
                               p_valclnm, p_mapcmbcd, p_excseq, p_scdtyp, p_lgvrfyflg, p_lgvrfydt):
    """
    Creates or updates a mapping detail using TRG.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference (must exist)
        p_trgclnm: Target column name
        p_trgcldtyp: Target column data type
        p_trgkeyflg: Is key column (Y/N)
        p_trgkeyseq: Key sequence
        p_trgcldesc: Column description
        p_maplogic: Mapping logic (SQL)
        p_keyclnm: Key column name
        p_valclnm: Value column name
        p_mapcmbcd: Mapping combination code
        p_excseq: Execution sequence
        p_scdtyp: SCD Type
        p_lgvrfyflg: Logic verification flag (Y/N)
        p_lgvrfydt: Logic verification date
        
    Returns:
        Mapping detail ID
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameter
        v_mapdtlid = cursor.var(oracledb.NUMBER)
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :result := TRG.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL(
                p_mapref => :p_mapref,
                p_trgclnm => :p_trgclnm,
                p_trgcldtyp => :p_trgcldtyp,
                p_trgkeyflg => :p_trgkeyflg,
                p_trgkeyseq => :p_trgkeyseq,
                p_trgcldesc => :p_trgcldesc,
                p_maplogic => :p_maplogic,
                p_keyclnm => :p_keyclnm,
                p_valclnm => :p_valclnm,
                p_mapcmbcd => :p_mapcmbcd,
                p_excseq => :p_excseq,
                p_scdtyp => :p_scdtyp,
                p_lgvrfyflg => :p_lgvrfyflg,
                p_lgvrfydt => :p_lgvrfydt
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            result=v_mapdtlid,
            p_mapref=p_mapref,
            p_trgclnm=p_trgclnm,
            p_trgcldtyp=p_trgcldtyp,
            p_trgkeyflg=p_trgkeyflg,
            p_trgkeyseq=p_trgkeyseq,
            p_trgcldesc=p_trgcldesc,
            p_maplogic=p_maplogic,
            p_keyclnm=p_keyclnm,
            p_valclnm=p_valclnm,
            p_mapcmbcd=p_mapcmbcd,
            p_excseq=p_excseq,
            p_scdtyp=p_scdtyp,
            p_lgvrfyflg=p_lgvrfyflg,
            p_lgvrfydt=p_lgvrfydt
        )
        connection.commit()
        
        # Get the result
        mapdtlid = v_mapdtlid.getvalue()
        return mapdtlid
        
    except Exception as e:
        print(f"Error creating/updating mapping detail: {str(e)}")
        raise
        
    finally:
        if cursor:
            cursor.close()

def validate_logic_in_db(connection, p_logic, p_keyclnm, p_valclnm):
    """
    Validates the logic using TRG.PKGDWMAPR.VALIDATE_LOGIC
    
    Args:
        connection: Oracle connection object
        p_logic: Logic to validate
        p_keyclnm: Key column name
        p_valclnm: Value column name
        
    Returns:
        Validation result (Y/N)
    """
    cursor = connection.cursor()
    v_is_valid = cursor.var(oracledb.STRING)
    
    sql = """
    BEGIN
        :result := TRG.PKGDWMAPR.VALIDATE_LOGIC(
            p_logic => :p_logic,
            p_keyclnm => :p_keyclnm,
            p_valclnm => :p_valclnm
        );
    END;
    """
    
    cursor.execute(
        sql,
        result=v_is_valid,
        p_logic=p_logic,
        p_keyclnm=p_keyclnm,
        p_valclnm=p_valclnm
    )
    connection.commit()
    
    return v_is_valid.getvalue()



def validate_logic2(connection, p_logic, p_keyclnm, p_valclnm):
    """
    Validates SQL logic using TRG.PKGDWMAPR.VALIDATE_LOGIC2
    
    Args:
        connection: Oracle connection object
        p_logic: SQL logic to validate
        p_keyclnm: Key column name
        p_valclnm: Value column name
    
    Returns:
        Tuple: (Validation result (Y/N), Error message if any)
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameters
        v_is_valid = cursor.var(oracledb.STRING)
        v_error = cursor.var(oracledb.STRING, 4000)  # Error output parameter
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :result := TRG.PKGDWMAPR.VALIDATE_LOGIC2(
                p_logic => :p_logic,
                p_keyclnm => :p_keyclnm,
                p_valclnm => :p_valclnm,
                p_err => :p_err
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            result=v_is_valid,
            p_logic=p_logic,
            p_keyclnm=p_keyclnm,
            p_valclnm=p_valclnm,
            p_err=v_error
        )
        connection.commit()
        
        # Get the results
        is_valid = v_is_valid.getvalue()
        error_message = v_error.getvalue()
        
        return is_valid, error_message
    
    except Exception as e:
        print(f"Error validating logic: {str(e)}")
        raise
    
    finally:
        if cursor:
            cursor.close()

def validate_all_mapping_details(connection, p_mapref):
    """
    Calls the Oracle function TRG.PKGDWMAPR.VALIDATE_MAPPING_DETAILS
    
    Args:
        connection: Oracle connection object
        p_mapref: Mapping reference to validate
        
    Returns:
        tuple: A tuple containing (result, error_message) where:
            - result: The function's return value ('Y' or 'N')
            - error_message: Any error message returned by the Oracle function
    """
    cursor = None
    try:
        cursor = connection.cursor()
        
        # Define the output parameters
        v_result = cursor.var(oracledb.STRING)
        v_err = cursor.var(oracledb.STRING, 400)  # VARCHAR2(400) in Oracle
        
        # SQL to execute with named parameters
        sql = """
        BEGIN
            :result := TRG.PKGDWMAPR.VALIDATE_MAPPING_DETAILS(
                p_mapref => :p_mapref,
                p_err => :p_err
            );
        END;
        """
        
        # Execute with named parameters
        cursor.execute(
            sql,
            result=v_result,
            p_mapref=p_mapref,
            p_err=v_err
        )
        connection.commit()
        # Get the results
        result = v_result.getvalue()
        error_message = v_err.getvalue()
        
        return result, error_message
        
    except Exception as e:
        print(f"Error validating mapping details: {str(e)}")
        raise
        
    finally:
        if cursor:
            cursor.close()


# job function

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
            :job_id := TRG.PKGDWJOB.CREATE_UPDATE_JOB(
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


