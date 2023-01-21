# Arbitron

A Discord bot that'll pick a random (arbitrary) item from a specified list.

- [Development](#development)
  - [Discord](#discord)
  - [Firebase](#firebase)
  - [NodeJS](#nodejs)

---

## Development

### Discord

1. Create a local `.env` file within this cloned repo.
1. In Discord go to your profile's `User Settings`
   - Go to `Advanced`
      - Enable `Developer Mode`
1. Create a test Server for you to mess around in.
1. Go to https://discord.com/developers/applications to start creating the application.
   - Click `New Application`
      - `Name: Arbitron` (click `Create`)
   - In the left menu:
      - General Information
         - Add a description
         - Copy the `APPLICATION ID`. Discord sometimes refers to `APPLICATION ID` as `CLIENT ID`.
         - Add that value to your `.env` file:
            ```
            DISCORD__APPLICATION_ID=<ID>
            ```
      - Bot
         - Click `Add Bot`
         - Click `Reset Token` to generate a token. Add the token to your `.env` file:
            ```
            DISCORD__BOT_TOKEN=<TOKEN>
            ```
      - OAuth2 > URL Generator
         ```
         [Scopes]
           [X] bot
           [X] applications.commands
         
         [Bot Permissions]
           [General Permissions]
             [X] Read Messages/View Channels
           
           [Text Permissions]
             [X] Send Messages
             [X] Send Messages in Threads
             [X] Use Slash Commands
         ```
         - Copy the URL in the `GENERATED URL` section.
1. Open the copied URL in another tab, and add the application to the test Server.


### Firebase

1. Create/sign in to a Google account. Then go to https://console.cloud.google.com.
1. Type `/` (to search for options), type **Manage Resources**, click on it.
   - Click on **CREATE PROJECT** in the top menu.
   - Project Name: `Discord Bot Arbitron`, click **CREATE**.
   - Click on the new project's hot dog menu (3 vertical dots), click **Settings**.
1. In the left menu, click **Service Accounts**.
   - Click **CREATE SERVICE ACCOUNT** in the top menu.
      ```
      Service account name: Firebase Database
      Service account description: General database stuff
      ```
      - Click **CREATE AND CONTINUE**
   - Set **Role** to `Owner`, click **CONTINUE**.
   - Click **DONE**.
   - Under **Actions**, choose **Manage Keys**.
      - Click **ADD KEY** then **Create new key**.
      - Key type should be `JSON`. Click **CREATE**.
1. The new JSON file should contains multiple properties, you only need `client_email`, `private_key`, and `project_id`. Add those values to your `.env` file.
   ```
   FIREBASE__CLIENT_EMAIL=<client_email>
   FIREBASE__PRIVATE_KEY="<private_key>"
   FIREBASE__PROJECT_ID=<project_id>
   ``` 
1. Navigate to https://console.firebase.google.com/. If you have multiple Google Users signed in, be sure to pick the proper one in the User menu (top right of screen).
1. Click on **Create a project**.
   - Step 1: When you click **Enter your project name**, a drop-down should appear with `Discord Bot Arbitron` listed. Click on it. Accept the terms, click **Continue**.
   - Step 2: Click **Continue**.
   - Step 3: Disable analytics, click **Add Firebase**.
1. In the left menu, click **Build**, then **Firestore Database**.
   - Click **Create database**
   - Select **Start in production mode**.
   - For **Cloud Firestore location**, I chose `us-west1`, but you pick whatever's closest to you or your Users. Click **Enable**.
1. If you want to view your database later, just go back into **Firebase Database**.

If you want/need to delete a project:
- Go to https://console.cloud.google.com
- If you're currently in your project's view, go into it's **Settings**, click on **SHUT DOWN**. Or you can follow the below steps.
- Type `/` and search for "Manage Resources".
- Check the box next to your project, then click **DELETE**.



### NodeJS

1. Within this repo, run:
   ```sh
   npm i
   ```
1. Start up in Dev mode:
   ```sh
   npm run start:dev
   ```
1. If you see a message that reads something like `Logged in as Arbitron`, go to your Discord Server and type `/arb` to see if the commands pop up.
