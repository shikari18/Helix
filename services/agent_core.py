import os
import sys
import time
import subprocess
import pyautogui
import psutil
from typing import Dict, Any

class HelixAgentCore:
    """
    The Native Control Engine for Helix.
    Handles mouse, keyboard, apps, and system functions.
    """
    def __init__(self):
        # Safety: Fail-safe feature 
        # (Moving mouse to corner of screen aborts the agent)
        pyautogui.FAILSAFE = True
        
    def execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a native system command.
        """
        action = command.get("action")
        params = command.get("params", {})
        
        try:
            if action == "move_mouse":
                pyautogui.moveTo(params.get("x"), params.get("y"), duration=0.5)
                return {"success": True, "details": "Mouse moved"}
                
            elif action == "click":
                pyautogui.click()
                return {"success": True, "details": "Clicked"}
                
            elif action == "type_text":
                pyautogui.write(params.get("text"), interval=0.1)
                return {"success": True, "details": "Typed text"}
                
            elif action == "open_app":
                app_name = params.get("app_name")
                if sys.platform == "win32":
                    os.startfile(app_name)
                else:
                    subprocess.Popen(["open", "-a", app_name])
                return {"success": True, "details": f"Opened {app_name}"}
                
            elif action == "screenshot":
                path = os.path.join(os.getcwd(), "agent_vision.png")
                pyautogui.screenshot(path)
                return {"success": True, "path": path}
                
            elif action == "get_system_info":
                return {
                    "success": True,
                    "cpu": psutil.cpu_percent(),
                    "memory": psutil.virtual_memory().percent,
                    "os": sys.platform
                }
                
            return {"success": False, "error": f"Unknown action: {action}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

# Singleton instance
agent_core = HelixAgentCore()
