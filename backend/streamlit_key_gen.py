# backend/generate_license_app.py
import streamlit as st
import os
import sys
import re
from pathlib import Path
import pyperclip # For copy functionality if st.code's button isn't enough
import traceback # For better error display

# --- Add backend directory to Python path to find key_gen ---
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from key_gen import LicenseKeyGenerator, generate_secret_key, get_system_identifier
except ImportError as e:
    st.error(f"Error importing 'key_gen.py': {e}")
    st.error(f"Ensure 'key_gen.py' is in the directory: {backend_dir}")
    st.stop()

# --- Configuration ---
SECRET_KEY_FILE = backend_dir / "secret.key"
AVAILABLE_FEATURES = ["basic", "advanced", "reporting", "premium", "enterprise"] # Define available features

# --- Helper Functions ---
def load_secret_key():
    """Loads the secret key from the file."""
    if not SECRET_KEY_FILE.exists():
        st.warning(
            f"Secret key file ('{SECRET_KEY_FILE.name}') not found in {backend_dir}. "
            "Generate one using 'key_gen.py' or click below. "
            "Ensure your main application uses the SAME secret key."
        )
        if st.button("Generate New Secret Key File", key="generate_secret_key_btn"):
            secret_key = generate_secret_key()
            try:
                with open(SECRET_KEY_FILE, "wb") as f:
                    f.write(secret_key)
                st.success(f"New secret key generated and saved to '{SECRET_KEY_FILE.name}'.")
                st.rerun() # Rerun to load the new key
            except Exception as e:
                st.error(f"Failed to write secret key file: {e}")
                return None
        return None
    try:
        with open(SECRET_KEY_FILE, "rb") as f:
            return f.read()
    except Exception as e:
        st.error(f"Failed to read secret key file: {e}")
        return None

def is_valid_mac(mac_string):
    """Basic validation for MAC address format."""
    if not mac_string:
        return False
    # Regex to match common MAC formats (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX or XXXXXXXXXXXX)
    # Allow empty string if auto-fetch is used later
    pattern = re.compile(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{12})$')
    return pattern.match(mac_string) is not None

def clean_mac(mac_string):
    """Removes separators from MAC address."""
    if not mac_string:
        return None
    return mac_string.replace(':', '').replace('-', '').upper()

def get_local_mac_safely():
    """Safely get local MAC, returning None on error."""
    try:
        # Adding a spinner for user feedback during fetch
        with st.spinner("Fetching local MAC address..."):
            mac = get_system_identifier()
            return mac
    except Exception as e:
        st.toast(f"Could not automatically get MAC address: {e}", icon="⚠️") # Use toast for less intrusive error
        return None

def update_mac_input():
    """Callback function for the checkbox to update MAC address state."""
    if st.session_state.use_local_mac:
        fetched_mac = get_local_mac_safely()
        st.session_state.local_mac = fetched_mac
        # Update the manual input field's state as well for immediate reflection
        if fetched_mac:
            st.session_state.mac_input_manual = fetched_mac
        else:
            # If fetch fails, uncheck the box and clear manual input
            st.session_state.use_local_mac = False
            st.session_state.mac_input_manual = ""
            st.warning("Failed to fetch local MAC. Please enter manually.")
    else:
        # Clear local mac and manual input when switching back to manual
        st.session_state.local_mac = None
        st.session_state.mac_input_manual = ""


# --- Initialize Session State ---
if 'use_local_mac' not in st.session_state:
    st.session_state.use_local_mac = False
if 'local_mac' not in st.session_state:
    st.session_state.local_mac = None
if 'mac_input_manual' not in st.session_state:
    st.session_state.mac_input_manual = ""
if 'generated_key' not in st.session_state:
    st.session_state.generated_key = ""



# --- Streamlit App UI ---
st.set_page_config(page_title="License Key Generator", layout="wide") # Use wide layout

c1,col1, col2 = st.columns([1,5,1]) # Create columns for layou


col1.title("🔑 License Key Generator")
col1.caption("Generate license keys for the Ahana DW Tool")

# Load Secret Key
secret_key = load_secret_key()

if secret_key:
    col1.success(f"Secret key loaded successfully from '{SECRET_KEY_FILE.name}'.")

    

    with col1:
        st.subheader("License Configuration")

        # --- MAC Address Input (Moved Outside Form) ---
        st.checkbox(
            "Use this system's MAC Address automatically",
            key='use_local_mac', # Use key to manage state
            help="If checked, the MAC address of the machine running this tool will be used.",
            on_change=update_mac_input # Call the update function on change
        )

        # Determine if input is disabled based on checkbox state *after* on_change might have run
        mac_input_disabled = st.session_state.use_local_mac and st.session_state.local_mac is not None

        mac_address_input = st.text_input(
            "Target System MAC Address*",
            key="mac_input_manual", # Use session state key directly
            disabled=mac_input_disabled,
            help="Enter MAC (e.g., 00:1A:2B:3C:4D:5E or 001A2B3C4D5E). Disabled if 'Use automatically' is checked and successful."
        )
        # --- End MAC Address Input ---

        # --- Input Form (Only for Duration and Features) ---
        with st.form("license_form"):
            st.write("**Configure and Submit:**") # Add a title inside the form
            # MAC inputs are now outside the form

            days_valid = st.number_input(
                "Validity Duration (Days)*",
                min_value=1,
                value=365,
                step=1,
                help="Number of days the license will be valid from today."
            )

            # --- Feature Selection ---
            selected_features = st.multiselect(
                "Select Features*",
                options=AVAILABLE_FEATURES,
                default=["basic"], # Default selection
                help="Choose the features to include in the license."
            )
            # --- End Feature Selection ---

            submitted = st.form_submit_button("🚀 Generate License Key")

    # --- Generation Logic & Display ---
    # Place generation logic outside the form but dependent on submission
    if submitted:
        error_messages = []
        final_mac_to_use = None

        # Determine MAC to use based on state *at submission time*
        if st.session_state.use_local_mac:
            if st.session_state.local_mac:
                final_mac_to_use = st.session_state.local_mac # Already cleaned
            else:
                # This case means checkbox was checked, but fetch failed before submission
                 error_messages.append("Automatic MAC fetch failed. Please uncheck and enter manually.")
        else: # Manual mode
            manual_mac = st.session_state.mac_input_manual
            if not manual_mac:
                error_messages.append("MAC Address is required when not using automatic fetching.")
            elif not is_valid_mac(manual_mac):
                error_messages.append("Invalid MAC Address format entered manually.")
            else:
                final_mac_to_use = clean_mac(manual_mac)

        if days_valid <= 0:
             error_messages.append("Validity duration must be at least 1 day.")

        if not selected_features:
            error_messages.append("At least one feature must be selected.")

        if not final_mac_to_use and not error_messages: # Safety check
            error_messages.append("Could not determine MAC address to use.")

        if error_messages:
             st.session_state.generated_key = "" # Clear previous key on error
             with col1: # Display errors in the second column
                 st.error("Please fix the following errors:")
                 for msg in error_messages:
                     st.error(f"- {msg}")
        else:
            # Prepare data for generator
            system_id = final_mac_to_use
            features_list = selected_features # Already a list from multiselect

            st.spinner("Generating key...")
            try:
                generator = LicenseKeyGenerator(secret_key=secret_key)
                license_key = generator.generate_license_key(
                    system_id=system_id,
                    days_valid=int(days_valid),
                    features=features_list
                )
                st.session_state.generated_key = license_key # Store in session state
                col1.success("License key generated successfully!")
                #col1.balloons()

            except Exception as e:
                st.session_state.generated_key = "" # Clear previous key on error
                with col1: # Display generation errors in the second column
                    st.error(f"An error occurred during key generation: {e}")
                    st.code(traceback.format_exc()) # Show full traceback for debugging

    # --- Display Area (always visible in col2 if key exists) ---
    with col1:
        st.subheader("Generated License Key")
        if st.session_state.generated_key:
            st.text_area(
                "License Key",
                value=st.session_state.generated_key,
                height=200, # Make text area larger
                key="license_display_area",
                help="Copy the key below."
            )
            if st.button("📋 Copy Key", key="copy_key_btn"):
                try:
                    pyperclip.copy(st.session_state.generated_key)
                    st.toast("License key copied to clipboard!", icon="✅")
                except Exception as e:
                    st.toast(f"Could not copy to clipboard: {e}", icon="❌")
                    st.info("Manual copy might be needed.") # Fallback info
        else:
             col1.info("Generate a key using the form on the left.")


else:
    col1.info("Please ensure the secret key is available to proceed.")

col1.markdown("---")
col1.caption(f"Using secret key file: {SECRET_KEY_FILE}")
col1.caption("Remember to keep the 'secret.key' file secure and consistent between generation and validation.")
