from sqlalchemy import  text
import oracledb
def create_update_mapping(connection, p_mapref, p_mapdesc, p_trgschm, p_trgtbtyp, 
                         p_trgtbnm, p_frqcd, p_srcsystm, p_lgvrfyflg, p_lgvrfydt, p_stflg,p_blkprcrows):
    """
    Creates or updates a mapping using MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING
    
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
            :result := MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING(
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
    Creates or updates a mapping detail using MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL
    
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
            :result := MAP.PKGDWMAPR.CREATE_UPDATE_MAPPING_DETAIL(
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
    Validates the logic using MAP.PKGDWMAPR.VALIDATE_LOGIC
    
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
        :result := MAP.PKGDWMAPR.VALIDATE_LOGIC(
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
    Validates SQL logic using MAP.PKGDWMAPR.VALIDATE_LOGIC2
    
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
            :result := MAP.PKGDWMAPR.VALIDATE_LOGIC2(
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
    Calls the Oracle function MAP.PKGDWMAPR.VALIDATE_MAPPING_DETAILS
    
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
            :result := MAP.PKGDWMAPR.VALIDATE_MAPPING_DETAILS(
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

