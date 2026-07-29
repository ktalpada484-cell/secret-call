// Automatically request microphone access when the app/page loads
async function initMicrophonePermission() {
    try {
        console.log("Requesting Microphone Permission...");
        
        // Triggers browser/app native microphone prompt
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        console.log("Microphone Access Granted!");
        
        // Stop initial stream tracks after getting permission
        stream.getTracks().forEach(track => track.stop());
        
        return true;
    } catch (err) {
        console.error("Microphone Access Denied or Not Supported:", err);
        alert("⚠️ Microphone Access Required!\n\nPlease allow Microphone permissions in your Browser/App Settings to make Secret Calls.");
        return false;
    }
}

// Page load hote hi run hoga
window.addEventListener('DOMContentLoaded', () => {
    initMicrophonePermission();
});

