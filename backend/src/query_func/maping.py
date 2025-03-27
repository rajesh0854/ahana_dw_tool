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

def get_error_massage(conn, map_detail_id):
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

import oracledb

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


