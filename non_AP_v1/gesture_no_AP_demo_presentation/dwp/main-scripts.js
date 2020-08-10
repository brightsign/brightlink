

function getPermission() {
	GESTURE.getGesturePermission().then((status)=>{
		if(status==GESTURE.permissionStatus.GRANTED){
			GESTURE.onFlickLeftEvent = ()=>{
                $.post('/SendUDP', { key: 'Flick Left' });
                $("#gestureMessage").text("Flick Left")
			};
			GESTURE.onFlickRightEvent = ()=>{
                $.post('/SendUDP', { key: 'Flick Right' });
                $("#gestureMessage").text("Flick Right")
			};
			GESTURE.onPitchEvent = ()=>{
                $.post('/SendUDP', { key: 'Pitch' });
                $("#gestureMessage").text("Pitch")
			};
			GESTURE.onMobileActive = ()=>{
                $.post('/SendUDP', { key: 'Activity' });
                $("#gestureMessage").text("Activity")
			};
			GESTURE.onMobileInActive = ()=>{
                $.post('/SendUDP', { key: 'Sleep time' });
                $("#gestureMessage").text("Sleep Time")
			}
		}
	});
}
