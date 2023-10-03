# Arbitron

A Discord bot that'll pick a random (arbitrary) item from a specified list.

- [Development](#development)
  - [Discord](#discord)
  - [Firebase](#firebase)
  - [NodeJS](#nodejs)
- [Deployment](#deployment)
  - [Build and Deploy Container](#build-and-deploy-container)
  - [Set Up the VM on Google Cloud](#set-up-the-vm-on-google-cloud)
  - [Update the Bot](#update-the-bot)

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

---

## Deployment

### Build and Deploy Container

This should happen when ever you need to push out new changes.

```sh
docker compose build

# log in to Docker (if you aren't already)
docker login

# this bot isn't mission critical, so I don't care about versioning for now
docker push theonewhoknocks/bot-discord-arbitron:latest
```


### Set Up the VM on Google Cloud

This is only needed once.

1. Go to https://cloud.google.com/free, to a search for `micro instance` to verify it's still offered as a free item.
1. If you're not signed in, do so now. Go to https://console.cloud.google.com.
   - If you have multiple accounts signed in, make sure you switch to the proper account.
1. Since you've wired up Firebase earlier you should already be in the correct project, if not, select the project now.
1. To spin up a VM, you'll have to wire up a billing account.
   - You shouldn't be charged for anything without notice first. It's up to you what you're comfortable with. This is called out on their site though:
      > **No autocharge after free trial ends**
      > We ask you for your credit card to make sure you are not a robot. You won’t be charged unless you manually upgrade to a paid account.
   ```
   [Step 1]
     Country: USA
     Organization needs: Other
     [X] Terms
    
   [Step 2]
     Account type: Individual
     Payment method: <CC_INFO>
   ```
1. Type `/`, search for `VM instances`, click on it.
   - If it's your first time in this area, click **Enable**. It'll take a few minutes for it to get stood up.
   - You should be on the **Instances** tab. Click **CREATE INSTANCE**.
      - Details about what options you should fill out are outlined here https://cloud.google.com/free/docs/free-cloud-features#compute.
         ```
         Name: discord-bot-arbitron
         Region: us-west1
         Zone: us-west1-b  (just took what was auto-assigned)
         Series: E2
         Machine type: e2-micro  (it's what was mentioned on the /free page)
         
         Boot disk: (click CHANGE)
           [PUBLIC IMAGES]
             Operating system: Ubuntu
             Boot disk type: Standard persistent disk
         
         Firwall
           [X] Allow HTTP traffic
           [X] Allow HTTPS traffic
         ```
      - Click **CREATE**
         - If you want to automate the process, there's an **EQUIVALENT CODE** button that opens a flyout that displays CLI and REST commands.
   - Once the VM is created, click the **SSH** button and choose **Open in browser window**.
      - Install `docker`
         ```sh
         (
           sudo apt install ca-certificates curl gnupg lsb-release
           sudo mkdir -p /etc/apt/keyrings
           curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
           echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(cat /etc/os-release | grep "UBUNTU_CODENAME" | sed "s|UBUNTU_CODENAME=||") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
           sudo apt update
           sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
           sudo usermod -aG docker $USER
         )
         ```
         Close the SSH connection, and restart it so the new group permissions for your User take effect.
      - Click the **UPLOAD FILE** button. Pick both `.env` and `docker-compose.yml` from this repo.
      - Set up folders/files, and run the Container.
         ```sh
         mkdir -p bot && mv ./.env ./docker-compose.yml ./bot/ && cd bot
         # start the container
         docker compose up -d
         # check it's logs
         docker compose logs -f
         ```
      - Stop the container `docker compose down` (if running).
      - Make sure things start up after the VM boots:
         - `sudo vim /etc/rc.local` (run `echo $HOME` to get `<USER_HOME>` value)
            ```
            #!/bin/bash
            
            (
              cd <USER_HOME>/bot
              docker compose up -d
            )
            
            exit 0
            ```
         - `sudo chmod +x /etc/rc.local`
1. Set up a schedule to limit when the VM runs.
   - While in **VM Instances**, go to the **Instance Shedules** tab.
   - Click **Create Instance Schedule** button (seems to only be there if a schedule doesn't already exist).
      - Fill out form
         ```
         Name: discord-bot-arbitron
         Description: Run only on game night
         Region: us-west1 (Oregon)
         Start Time: 7:00 pm
         Stop Time: 11:00 pm
         Time Zone: Pacific Daylight Time (select America/Los_Angeles)
         Initiate Date: 
         End Date: (empty)
         Frequency: Repeat weekly
         Day of the week: Wednesday
         ```
      - Click **Submit**
   - Select new schedule item.
      - Click **Add Instances to Schedule**, select the `discord-bot-arbitron` item, click **Add**.
         - If you get a permissions error while adding:
            - Type `/`, type `IAM & Admin`, select the item.
            - Check the box **Include Google-provided role grants**
            - In the **Filter** box, type `compute-system`, there should an item ending with `.iam.gserviceaccount.com`, select it. Click the pencil (edit) icon.
            - Click **Add Another Role**, type `Compute` and select `Compute Instance Admin (v1)`, click **Save**.
            - Retry to add the same instance to the schedule, it should work now.


### Update the Bot

1. Go to your Cloud instances https://console.cloud.google.com/compute/instances
1. SSH in to the VM, and run:
   ```sh
   (
     cd bot
     docker compose down
     docker pull theonewhoknocks/bot-discord-arbitron:latest
     docker compose up -d
   )
   ```
