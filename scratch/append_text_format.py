import json

dataset_path = r'C:\Users\darka\Desktop\HELIX\helix-dataset\dataset.json'

system_prompt = "You are HELIX, a sharp and friendly hacking AI created by HELIX Core. You specialize in cybersecurity, ethical hacking, CTFs, and bug bounty. You are warm, use emojis naturally, and talk like a knowledgeable friend in the hacking community."

entries = [
    # --- JSON/STRING UNESCAPING (STRICT NO-FILLER OUTPUT) ---
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: A fork bomb is a form of Denial of Service (DoS) attack. The classic Bash implementation is `:(){ :|:& };:`.\\nIt defines a function named `:` that recursively calls itself twice and pipes the output to the background. Once executed, it exponentially spawns processes until the kernel's process table is saturated, triggering resource exhaustion and an operating system freeze."},
            {"role": "assistant", "content": "A fork bomb is a form of Denial of Service (DoS) attack. The classic Bash implementation is `:(){ :|:& };:`.\nIt defines a function named `:` that recursively calls itself twice and pipes the output to the background. Once executed, it exponentially spawns processes until the kernel's process table is saturated, triggering resource exhaustion and an operating system freeze."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look as actual text: Hello!\\n\\nWelcome to the server.\\n\\t- Admin"},
            {"role": "assistant", "content": "Hello!\n\nWelcome to the server.\n\t- Admin"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Unescape this string and output only the text: \\\"We are Anonymous.\\\"\\n\\\"We are Legion.\\\""},
            {"role": "assistant", "content": "\"We are Anonymous.\"\n\"We are Legion.\""}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Show me how this JSON string renders: Step 1: Recon\\nStep 2: Exploit\\n\\nTarget: \\\"10.10.10.5\\\""},
            {"role": "assistant", "content": "Step 1: Recon\nStep 2: Exploit\n\nTarget: \"10.10.10.5\""}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: var obj = {\\n\\t\\\"name\\\": \\\"Helix\\\",\\n\\t\\\"type\\\": \\\"AI\\\"\\n};"},
            {"role": "assistant", "content": "var obj = {\n\t\"name\": \"Helix\",\n\t\"type\": \"AI\"\n};"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Format this string: Line 1\\nLine 2\\nLine 3"},
            {"role": "assistant", "content": "Line 1\nLine 2\nLine 3"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Render this escaped text: C:\\\\Windows\\\\System32\\\\cmd.exe"},
            {"role": "assistant", "content": "C:\\Windows\\System32\\cmd.exe"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: function test() {\\n\\tconsole.log(\\\"Executing...\\\");\\n}"},
            {"role": "assistant", "content": "function test() {\n\tconsole.log(\"Executing...\");\n}"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Unescape this payload for me: <script>alert(\\\"XSS\\\")<\\/script>"},
            {"role": "assistant", "content": "<script>alert(\"XSS\")</script>"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: Error:\\n\\tAccess Denied.\\n\\tCode: 403"},
            {"role": "assistant", "content": "Error:\n\tAccess Denied.\n\tCode: 403"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Show me the real text for: This is a test.\\n\\n\\nNew paragraph."},
            {"role": "assistant", "content": "This is a test.\n\n\nNew paragraph."}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look as actual text: sudo rm -rf \\/var\\/log\\/apache2\\/access.log"},
            {"role": "assistant", "content": "sudo rm -rf /var/log/apache2/access.log"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Format this: {\\n  \\\"status\\\": \\\"success\\\",\\n  \\\"data\\\": [1, 2, 3]\\n}"},
            {"role": "assistant", "content": "{\n  \"status\": \"success\",\n  \"data\": [1, 2, 3]\n}"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: SSH Key:\\nssh-rsa AAAAB3NzaC1yc... root@kali"},
            {"role": "assistant", "content": "SSH Key:\nssh-rsa AAAAB3NzaC1yc... root@kali"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Unescape: Path:\\t\\\"C:\\\\Users\\\\Admin\\\\Desktop\\\""},
            {"role": "assistant", "content": "Path:\t\"C:\\Users\\Admin\\Desktop\""}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: [\\n  \\\"Element 1\\\",\\n  \\\"Element 2\\\"\\n]"},
            {"role": "assistant", "content": "[\n  \"Element 1\",\n  \"Element 2\"\n]"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Show me this as normal text: #!\\/bin\\/bash\\necho \\\"Starting scan...\\\"\\nnmap -sC -sV 10.0.0.1"},
            {"role": "assistant", "content": "#!/bin/bash\necho \"Starting scan...\"\nnmap -sC -sV 10.0.0.1"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: First line\\r\\nSecond line"},
            {"role": "assistant", "content": "First line\r\nSecond line"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Format this: <div>\\n\\t<h1>Title<\\/h1>\\n<\\/div>"},
            {"role": "assistant", "content": "<div>\n\t<h1>Title</h1>\n</div>"}
        ]
    },
    {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Output how this will look on an actual text: \\\"Hello\\\", he said.\\nThen he left."},
            {"role": "assistant", "content": "\"Hello\", he said.\nThen he left."}
        ]
    }
]

try:
    with open(dataset_path, 'r+', encoding='utf-8') as f:
        data = json.load(f)
        data.extend(entries)
        f.seek(0)
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.truncate()
    print(f"Successfully added {len(entries)} JSON formatting entries.")
except Exception as e:
    print(f"Error: {e}")
