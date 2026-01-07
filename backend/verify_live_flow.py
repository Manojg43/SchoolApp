import requests
import json
import datetime

BASE_URL = "https://schoolapp-6vwg.onrender.com/api"
USERNAME = "7519194111"
PASSWORD = "Manoj43@"

def run_verification():
    print(f"[*] Starting verification against {BASE_URL}")
    
    # 1. Login
    print(f"[*] Logging in as {USERNAME}...")
    try:
        resp = requests.post(f"{BASE_URL}/login/", json={"username": USERNAME, "password": PASSWORD})
        if resp.status_code != 200:
            print(f"[!] Login Failed: {resp.text}")
            return
        token = resp.json().get('token')
        print(f"[+] Login Success! Token: {token[:10]}...")
        
        headers = {
            "Authorization": f"Token {token}",
            "Content-Type": "application/json"
        }
    except Exception as e:
        print(f"[!] Connection Error: {e}")
        return

    # 2. Get Metadata (Class/Section)
    print("\n[*] Fetching Metadata...")
    class_id = None
    section_id = None
    
    # Get Classes
    resp = requests.get(f"{BASE_URL}/classes/", headers=headers)
    classes = resp.json()
    # Pagination check
    if isinstance(classes, dict) and 'results' in classes:
        classes = classes['results']
        
    for c in classes:
        if "10" in c['name']: # Search for Class 10
            class_id = c['id']
            print(f"[+] Found Class 10: ID {class_id} ({c['name']})")
            break
            
    if not class_id:
        print("[!] Could not find Class 10. Using first available class.")
        if classes:
            class_id = classes[0]['id']
            print(f"[*] Using Class: {classes[0]['name']}")

    # Get Sections
    resp = requests.get(f"{BASE_URL}/sections/?parent_class={class_id}", headers=headers)
    sections = resp.json()
    if isinstance(sections, dict) and 'results' in sections:
        sections = sections['results']
        
    for s in sections:
        if "A" in s['name'].upper():
            section_id = s['id']
            print(f"[+] Found Section A: ID {section_id}")
            break
            
    if not section_id and sections:
        section_id = sections[0]['id'] 
        print(f"[*] Using Section: {sections[0]['name']}")

    # 3. Create Student
    print("\n[*] Creating Student 'Rahul LiveTest'...")
    student_data = {
        "first_name": "Rahul",
        "last_name": "LiveTest",
        "date_of_birth": "2010-01-01",
        "gender": "M",
        "enrollment_number": f"LIVE{datetime.datetime.now().strftime('%H%M%S')}",
        "current_class": class_id,
        "section": section_id,
        "father_name": "Suresh LiveTest",
        "mother_name": "Sunita LiveTest",
        "emergency_mobile": "9876543210",
        "address": "123 Live Street",
        "religion": "Hindu",
        "caste": "General"
    }
    
    resp = requests.post(f"{BASE_URL}/students/", json=student_data, headers=headers)
    if resp.status_code not in [200, 201]:
        print(f"[!] Student Creation Failed: {resp.text}")
        return
        
    student = resp.json()
    student_id = student['id']
    print(f"[+] Student Created: ID {student_id} ({student['first_name']} {student['last_name']})")

    # 4. Create Invoice (20k)
    print("\n[*] Creating Invoice (₹20,000)...")
    invoice_data = {
        "student": student_id,
        "title": "Verification Tuition Fee",
        "total_amount": 20000,
        "due_date": (datetime.date.today() + datetime.timedelta(days=30)).isoformat(),
        "fee_term": "ANNUAL"
    }
    
    resp = requests.post(f"{BASE_URL}/finance/invoices/", json=invoice_data, headers=headers)
    if resp.status_code not in [200, 201]:
        print(f"[!] Invoice Creation Failed: {resp.text}")
        return
        
    invoice = resp.json()
    invoice_id = invoice['id']
    print(f"[+] Invoice Created: ID {invoice_id} | Balance: {invoice['balance_due']}")

    # 5. Pay 10k (Partial)
    print("\n[*] Collecting 1st Payment (₹10,000)...")
    receipt_data = {
        "invoice": invoice_id,
        "amount": 10000,
        "mode": "CASH",
        "remarks": "Part 1 Verification"
    }
    
    resp = requests.post(f"{BASE_URL}/finance/receipts/", json=receipt_data, headers=headers)
    if resp.status_code not in [200, 201]:
        print(f"[!] Payment 1 Failed: {resp.text}")
    else:
        receipt = resp.json()
        print(f"[+] Receipt 1 Created: {receipt['receipt_no']}")
        
        # Verify status
        inv_check = requests.get(f"{BASE_URL}/finance/invoices/{invoice_id}/", headers=headers).json()
        print(f"    -> Invoice Status: {inv_check['status']} (Expected: PARTIAL)")
        print(f"    -> Balance Due: {inv_check['balance_due']} (Expected: 10000.00)")

    # 6. Pay Remaining 10k (Full)
    print("\n[*] Collecting 2nd Payment (₹10,000)...")
    receipt_data['amount'] = 10000
    receipt_data['remarks'] = "Part 2 Final"
    
    resp = requests.post(f"{BASE_URL}/finance/receipts/", json=receipt_data, headers=headers)
    if resp.status_code not in [200, 201]:
        print(f"[!] Payment 2 Failed: {resp.text}")
    else:
        receipt = resp.json()
        print(f"[+] Receipt 2 Created: {receipt['receipt_no']}")
        
        # Verify status
        inv_check = requests.get(f"{BASE_URL}/finance/invoices/{invoice_id}/", headers=headers).json()
        print(f"    -> Invoice Status: {inv_check['status']} (Expected: PAID)")
        print(f"    -> Balance Due: {inv_check['balance_due']} (Expected: 0.00)")

    print("\n[ok] Verification Complete!")

if __name__ == "__main__":
    run_verification()
