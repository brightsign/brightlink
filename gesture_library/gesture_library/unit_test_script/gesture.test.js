const { gesture } = require('../brightlink-gesture');

//gesture object validation
describe("GESTURE Object", () => {
    //test if we have gesture object on window
    test("should be available on windows", () => {
        expect(window).toHaveProperty('GESTURE');
    });
    //test if its already registered
    test("Event not registered yet", () => {
        expect(GESTURE.firstRegister).toBe(true);
    });
    //should grant permission as its not iOS to grant
    test("should grant permission", (done) => {
        window.DeviceMotionEvent = {};
        GESTURE.getGesturePermission().then((status)=>{
            expect(status).toBe(GESTURE.permissionStatus.GRANTED);
            done();
        });
    });
    //should call function to initilialize event
    test("should register event on initialization", (done) => {
        GESTURE.getGesturePermission().then((status)=>{
            expect(GESTURE.firstRegister).toBe(false);
            done();
        });
    });
})