import {registerUserPageEventHandlers} from "/event/userpage_eventHandlers.js";
import {initializeEmitEvent} from "/event/eventEmitter.js"
import {initUserProfilePage} from "/pages/userpage_manager.js";


registerUserPageEventHandlers();
initializeEmitEvent();
initUserProfilePage();
