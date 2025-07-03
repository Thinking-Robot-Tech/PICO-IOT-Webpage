# QR Code Generator GUI for PICO IoT Devices
#
# This script creates a simple graphical interface to generate QR codes
# for device MAC addresses.
#
# Installation:
# You need to install the required libraries. Open your terminal or
# command prompt and run:
# pip install "qrcode[pil]"
#
# How to Run:
# 1. Save this file as 'generate_qr_gui.py'.
# 2. Open your terminal.
# 3. Navigate to the folder where you saved the file.
# 4. Run the script:
#    python generate_qr_gui.py

import qrcode
import os
import tkinter as tk
from tkinter import messagebox, Label, Entry, Button, PhotoImage
from PIL import Image, ImageTk

def generate_and_display_qr(mac_address_entry, image_label, status_label):
    """
    Generates a QR code from the input field, saves it, and displays it in the GUI.
    """
    mac_address = mac_address_entry.get().strip()
    
    if not mac_address:
        messagebox.showerror("Error", "MAC address cannot be empty.")
        return

    # --- QR Code Generation Logic (from original script) ---
    folder = "qrcodes"
    safe_filename = mac_address.replace(":", "").upper()
    data_to_encode = f"PICO-IOT:{mac_address}"

    if not os.path.exists(folder):
        os.makedirs(folder)

    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data_to_encode)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save the image file
        file_path = os.path.join(folder, f"qr_{safe_filename}.png")
        img.save(file_path)

        # --- Display Logic for GUI ---
        # Resize the image for display in the GUI window
        display_img = img.resize((250, 250), Image.Resampling.LANCZOS)
        photo_img = ImageTk.PhotoImage(display_img)

        # Update the image label
        image_label.config(image=photo_img)
        image_label.image = photo_img # Keep a reference to avoid garbage collection

        status_label.config(text=f"Success! Saved to {file_path}", fg="green")

    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")
        status_label.config(text="Generation failed.", fg="red")


def main():
    """Sets up and runs the Tkinter GUI application."""
    # --- Main Window Setup ---
    window = tk.Tk()
    window.title("PICO IoT QR Code Generator")
    window.geometry("400x500")
    window.resizable(False, False)
    window.configure(bg="#f0f0f0")

    # --- Widgets ---
    main_frame = tk.Frame(window, padx=20, pady=20, bg="#f0f0f0")
    main_frame.pack(expand=True, fill="both")

    # Input Label and Entry
    label_mac = Label(main_frame, text="Enter Device MAC Address:", font=("Helvetica", 12), bg="#f0f0f0")
    label_mac.pack(pady=(0, 5))

    entry_mac = Entry(main_frame, font=("Helvetica", 12), width=30, justify="center")
    entry_mac.pack(pady=5)

    # Generate Button
    generate_btn = Button(
        main_frame,
        text="Generate QR Code",
        font=("Helvetica", 12, "bold"),
        command=lambda: generate_and_display_qr(entry_mac, label_qr_image, status_label),
        bg="#007bff",
        fg="white",
        relief="flat",
        pady=5
    )
    generate_btn.pack(pady=20)

    # Image Display Label
    label_qr_image = Label(main_frame, bg="#f0f0f0")
    label_qr_image.pack(pady=10)
    
    # Status Label
    status_label = Label(main_frame, text="", font=("Helvetica", 10), bg="#f0f0f0")
    status_label.pack(pady=(10, 0))

    # --- Run the application ---
    window.mainloop()


if __name__ == "__main__":
    main()
