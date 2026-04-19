# Fiery Attraction Server
## Instructions
### Installing the Server
1. Download the Server folder and put it in a suitable location.
2. Install NPM
   - In Command Prompt enter: `winget install OpenJS.NodeJS`.
   - Follow the installer.
3. Open Command Prompt and navigate to the Server folder.
4. Run the command: `npm init`

### Running the server
1. Open Command Prompt and navigate to the Server folder.
2. Run the command: `npm start`

Now the server should be running! The default **port** is 6402. You can change the port at the top of the `server.js` file.

The **address** you can find visiting https://whatismyipaddress.com. The numbers after `IPv4` is your public IP Address.

If you are joining a server that is running on the same network as you, your address is your localhost, `127.0.0.1`.

### Firewall and Port Forwarding
To allow people outside of your network to access your port, you will need to adjust your firewall settings by adding a rule to allow connections to this port.
1. Windows Defender Firewall > Advanced Settings > Inbound Rules > New Rule
2. Port (TCP, Specific Port) - Must match the one in `server.js`.
3. Allow the Connection.
4. Next.
5. Set the name to something that makes sense (Fiery Attraction Server).

You also need to portfoward the address by signing into your router. If you have permission you can access the login by going to address under `Default Gateway` when you type `ipconfig` in Command Prompt. Looks like `192.168.x.1` where x is usually a small number. The steps to portfowarding vary depending on the router. I recommend finding a tutorial online for your specific router.

#### Alternative
It is possible to skip portfowarding by using a tunneling service such as [ngrok](https://ngrok.com/) to create a public URL (much easier).
1. Install ngrok and add the exe to your path so that it is accessible from the terminal.
2. Create an ngrok account.
3. Getting Started > Your Authtoken
4. In your terminal enter: `ngrok config add-authtoken YOUR_AUTHTOKEN`.
5. To open the port run the `ngrok-start.bat` file in the Server folder. Make sure the port is the same as the one at the top of `server.js`.

After those steps are complete, the port should be open.