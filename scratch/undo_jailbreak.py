import json

dataset_path = r'C:\Users\darka\Desktop\HELIX\helix-dataset\dataset.json'

try:
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Remove the 20 anti-jailbreak entries we just added
    original_length = len(data)
    data = data[:-20]
    new_length = len(data)

    with open(dataset_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully removed the last 20 entries. Dataset size went from {original_length} to {new_length}.")
except Exception as e:
    print(f"Error: {e}")
