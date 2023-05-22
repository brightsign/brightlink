/**
 * BrightLink Gesture library
 * Usage:
 * Include in HTML before actual script file 
 * <script src="brightlink-gesture.js"></script>
 * In your UI have a button that will start gesture. A button is needed for requesting iOS permission as permission is requested on user action and not automatically
 * Hence you can have following function change on<event> logic to send appropriate UDP commands
 * <pre><code>
 * function getPermission() {
	GESTURE.getGesturePermission().then((status)=>{
		if(status==GESTURE.permissionStatus.GRANTED){
			GESTURE.onFlickLeftEvent = ()=>{
				alert("flick left event");
			};
			GESTURE.onFlickRightEvent = ()=>{
				alert("flick right event");
			};
			GESTURE.onPitchEvent = ()=>{
				alert("pitch event");
			};
			GESTURE.onMobileActive = ()=>{
				alert("lift event");
			};
			GESTURE.onMobileInActive = ()=>{
				alert("mobile in active")
			}
		}
	});
}
</code></pre>
 */
class brightlink_gesture {
    /**
     * Initializing variables
     * @param {number} idleActivityTime - time in milliseconds to wait before deciding mobile is inactive.
     * @param {number} minActiveAcceleration - minimum acceleration with gravity to determine mobile is active.
     * @param {number} minActionAcceleration - minimum acceleration with gravity to determine mobile movement event like flip, pitch.
     */
    constructor() {
        this.idleActivityTime = 20000;
        this.debounceTime = 1000;
        this.minActiveAcceleration = 2;
        this.minActionAcceleration = 15;
        this.permissionStatus = {GRANTED:'granted',DENIED:'denied'};
        this.mobileInActive = false;
        this.firstRegister = true;
        this.inactiveTimer = null;
        this.enableEvent = true;
        window.ondevicemotion = null;
        window.ondeviceorientation = null;
    }
    /**
     * Public function to get permission for motion events.
     * This function is entry point to library and should be called after script is initialized.
     * If iOS will ask to grant permission
     * If Android will directly resolve without asking for permission
     * @return {Promise} This promise will be resolved when permission is either granted or rejected. Permission will resolve with value 'granted' or 'denied' that can be used with enum GESTURE.permissionStatus.GRANTED or GESTURE.permissionStatus.DENIED.
     */
    getGesturePermission() {
        $.post('/SendUDP', { key: 'Get Permission'});
        this.firstRegister = true;
        window.ondevicemotion = null;
        window.ondeviceorientation = null;
        let permissionPromise = new Promise((resolve) => {
            if ((/iPad|iPhone|iPod/.test(navigator.userAgent)) && DeviceMotionEvent.requestPermission) {
                this.requestDeviceMotionIOS(resolve);
            } else {
                this.onGestureEvent();
                this.activateMotionEvents(resolve);
            }
        });
        return permissionPromise;
    }
    /**
     * Private function to get iOS permission from user for device motion event and resolve promise accordingly.
     * @param {object} resolve - Permission will resolve with value 'granted' or 'denied'.
     */
    requestDeviceMotionIOS(resolve) {
        $.post('/SendUDP', { key: 'Requesting permission' });
        if (typeof (DeviceOrientationEvent).requestPermission === 'function') {
            (DeviceOrientationEvent).requestPermission()
                .then(permissionState => {
                    if (permissionState === this.permissionStatus.GRANTED) {
                        $.post('/SendUDP', { key: 'Permission Granted' });
                        this.onGestureEvent();
                        this.activateMotionEvents(resolve);
                    } else {
                        resolve(this.permissionStatus.DENIED);
                        $.post('/SendUDP', { key: 'Permission Denied' });
                    }
                })
        } else {
            this.activateMotionEvents(resolve);
        }
    }
    /**
     * Private function
     * Will reset timer to check mobile is active or inactive and accordingly resolve granted permission this handler is called only on positive case of granted permission.
     * @param {object} resolve - Permission will resolve with value 'granted'.
     */
    activateMotionEvents(resolve){
        this.resetInactiveTimer();
        resolve(this.permissionStatus.GRANTED);
    }
    /**
     * Private function
     * Raise an event when there is a acceleration with gravity greater than minActionAcceleration
     * onFlickLeftEvent assign a function to this property and this function will be involed when mobile is flipped left (previous slide).
     * onFlickRightEvent assign a function to this property and this function will be involed when mobile is flipped right (next slide).
     * onPitchEvent assign a function to this property and this function will be involed when mobile is pitch down (enter command).
     * @param {object} currentX - Acceleration with gravity on X axis.
     * @param {object} currentZ - Acceleration with gravity on Z axis.
     */
    raiseEvent(currentX, currentZ) {
        if (currentX > this.minActionAcceleration) {
            this.onFlickLeftEvent && this.onFlickLeftEvent();
            this.debounceEvent();
        } else if (currentX < -this.minActionAcceleration) {
            this.onFlickRightEvent && this.onFlickRightEvent();
            this.debounceEvent();
        } else if (currentZ > this.minActionAcceleration) {
            this.onPitchEvent && this.onPitchEvent();
            this.debounceEvent();
        }
    }
    /**
     * Private function
     * debounce motion event
     */
    debounceEvent(){
        this.enableEvent = false;
        let timeout = setTimeout(()=>{
            if(timeout){
                clearTimeout(timeout);
            }
            this.enableEvent = true;
        },this.debounceTime);
    }
    /**
     * Private function
     * This function checks if device is active or inactive
     * If device is inactive and there is some motion detected using minActiveAcceleration value comparison onMobileActive function will be called
     * onMobileActive assign a function to this property and this function will be involed when mobile is comes active (lift event)
     * @param {object} currentX - Acceleration with gravity on X axis.
     * @param {object} currentY - Acceleration with gravity on Y axis.
     * @param {object} currentZ - Acceleration with gravity on Z axis.
     */
    checkIfDeviceActive(currentX, currentY, currentZ) {
        if (currentX > this.minActiveAcceleration || currentY > this.minActiveAcceleration || currentZ > this.minActiveAcceleration){
            if(this.mobileInActive){
                this.onMobileActive && this.onMobileActive();
                this.mobileInActive = false;
            }
            this.resetInactiveTimer();
        }
    }
    /**
     * Private function
     * Clean timer and restart timer
     */
    resetInactiveTimer(){
        if(this.inactiveTimer){
            clearTimeout(this.inactiveTimer);
        }
        this.inactiveTimer = setTimeout(()=>{
            clearTimeout(this.inactiveTimer);
            this.mobileInActive = true;
            this.onMobileInActive && this.onMobileInActive();
        },this.idleActivityTime);
    }
    /**
     * Private function
     * When a mobile is moved this event will be take care to handle device motion and detect appropriate event
     */
    onGestureEvent() {
        if (window.DeviceMotionEvent != undefined && this.firstRegister) {
            this.firstRegister = false;
            window.ondevicemotion = (e) => {
                let currentX,currentY,currentZ;
                if(e.acceleration){
                    currentX = Math.round(e.acceleration.x);
                    currentY = Math.round(e.acceleration.y);
                    currentZ = Math.round(e.acceleration.z);
                }else{
                    currentX = Math.round(e.accelerationIncludingGravity.x);
                    currentY = Math.round(e.accelerationIncludingGravity.y);
                    currentZ = Math.round(e.accelerationIncludingGravity.z);
                }
                this.enableEvent && this.raiseEvent(currentX, currentZ);
                this.checkIfDeviceActive(currentX, currentY, currentZ);
            }
        }
    }
};
window.GESTURE = new brightlink_gesture();