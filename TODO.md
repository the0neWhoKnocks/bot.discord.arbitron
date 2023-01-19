- [ ] Create bot in Discord
- [ ] Determine where to host (it may determine file structure)
  - [ ] How to deploy
  - [ ] How/where to store/expose keys/env variables
- [ ] Wire up Firebase to store "choices" lists
- [ ] Commands `/arb`
  - [ ] `<LIST>` Chooses a random item from the list. The random choice seed will be based on the User's name/id and the timestamp of when the request was submitted.
    ```
    /arb game
    ```
  - [ ] `add <LIST> "<OPT>" "<OPT>"` Add item(s) to the choices list
    ```
    /arb add game "name 1" "name 2"
    ```
  - [ ] `remove <LIST> "<OPT>" "<OPT>"` Remove item(s) from the choices list
    ```
    /arb remove game "name 1" "name 2"
    ```
  - [ ] `help` Lists all available commands.
    ```
    /arb help
    ```
  - [ ] `add`, `remove`, `choose` will be based off of the Discord Server's name. So any entries ran in a Server will have an associated entry in the DB. Will have to use the Id of the Server to ensure name changes don't throw away all choices.
  - [ ] Arg parser for:
    - [ ] `add`, `remove`: 
      - [ ] `<LIST>`: Only accept lowercase, with hyphens for spaces
      - [ ] `<OPT>`: Just has to be surrounded in double quotes
  - [ ] Return confirmation messages for `add`, `remove`