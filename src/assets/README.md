# Assets

This directory contains static resources (SVGs, images, icons) used in the project.



## Self-Generated Sources

- `sounds/dialing_sound(canon).mp3`
  Source: Self-generated using custom WebAudio/JS synthesis
  Version: 1.0
  License: Proprietary — fully owned by the Serendilang project
  Notes:
  - This audio asset is synthesized programmatically (no external samples used).
  - No copyright claims from external libraries or composers.

- `sounds/incoming_call_sound.mp3`
  Source: Self-generated using WebAudio API tone synthesis
  Version: 1.0
  License: Proprietary — fully owned by the Serendilang project
  Notes:
  - Created specifically for the incoming call alert.
  - Not derived from any copyrighted melody or audio source.

- `sounds/receive_message_sound.mp3`
  Source: Self-generated notification sound using WebAudio programmatic synthesis
  Version: 1.0
  License: Proprietary — fully owned by the Serendilang project
  Notes:
  - A short UI notification tone generated purely by code.
  - No sampled audio or copyrighted content involved.




## External Sources

- `./images/defaultAvatar.svg`  
  Source: [Heroicons](https://heroicons.com/)  
  License: MIT License  
  Purpose: Used as the default avatar for users who have not uploaded a profile picture.

- `./images/videoCall.svg`
  Source: [Heroicons](https://heroicons.com/)
  License: MIT License
  Purpose: Used as video call button.

- `./images/phone.svg`
  Source: [Heroicons](https://heroicons.com/)
  License: MIT License
  Purpose: Used as voice call button.

- `./images/end_call.svg`  
  Source: [Google Fonts Material Symbols – call_end](https://fonts.google.com/icons?selected=Material+Symbols+Outlined:call_end:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=call_end&icon.size=24&icon.color=%231f1f1f)  
  License: Apache License Version 2.0 
  Purpose: Used as the end call (hang up) icon/button.

- `./images/heart.svg`  
  Source: [Heroicons](https://heroicons.com/)  
  License: MIT License  
  Purpose: Used as the like (heart) icon in post cards and user self page cards.  
  



- ./images/upload.svg
  Source: [Heroicons](https://heroicons.com/)
  License: MIT License
  Purpose: Used as upload or post button (represents “arrow up on a square,” symbolizing publishing or uploading content).
  name: arrow-up-on-square

- ./images/arrow_uturn_right.svg
  Source: [Heroicons](https://heroicons.com/)
  License: MIT License
  Purpose: Used to indicate messages sent by the current user in the conversation list.
  name: arrow-uturn-right



- ./images/face-smile.svg
  Source: [Heroicons](https://heroicons.com/)

  License: MIT License
  Purpose: Used as the emoji picker button in the chat input bar (represents a smiling face icon to open the emoji menu).
  name: face-smile




- `css/tailwind.css`  
  Source: [Tailwind CSS](https://tailwindcss.com)  
  Version: v2.2.19  
  License: MIT License  
  Note: This is the compiled stylesheet generated from Tailwind.  
  For development, refer to Tailwind’s official documentation.

- `css/tabler-icons.min.css`  
  Source: [Tabler Icons Webfont](https://tabler-icons.io/)  
  Version: (locked at the version downloaded from npm)  
  License: MIT License  
  Notes:  
  - Originally loaded from CDN (`https://cdn.jsdelivr.net/...`).  
  - We self-host the stylesheet in `/assets/css/` and the font files in `/assets/fonts/`.  
  - The font paths inside `tabler-icons.min.css` were modified to point to `/assets/fonts/`.  

  Example in CSS:  
  ```css
  src: url("/assets/fonts/tabler-icons.woff2") format("woff2"),
       url("/assets/fonts/tabler-icons.woff") format("woff"),
       url("/assets/fonts/tabler-icons.ttf") format("truetype");

---

## External Services

### TURN Server (coturn)
- **Software:** [coturn](https://github.com/coturn/coturn)
- **License:** BSD 3-Clause License  
- **Deployment:** Hosted on a separate EC2 instance  
- **Purpose:** Provides TURN/STUN relay services for WebRTC (voice and video calls).  
  
  It is a core dependency but not bundled directly with this repository.

## Guidelines

- Always document the origin and license of any third-party asset added here.  
- Prefer SVG over raster images (PNG/JPG) for scalability and smaller size.  
- If replacing an existing asset (e.g., default avatar), ensure consistent style and update this README accordingly.

