// === Constants ===
const BaseUrl = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
const Cohort = "2506-ftb-ct-web-pt";
const API = `${BaseUrl}/${Cohort}`;

// === State ===
let parties = [];
let selectedParty;
let rsvps = [];
let guests = [];

/** Updates state with all parties from the API */
async function getParties() {
  try {
    const response = await fetch(API + "/events");
    const result = await response.json();
    parties = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Updates state with a single party from the API */
async function getParty(id) {
  try {
    const response = await fetch(API + "/events/" + id);
    const result = await response.json();
    selectedParty = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Add new event */
async function addParty(party) {
  try {
    await fetch(`${API}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(party),
    });
    // Refreshes party list and adds newly added party
    await getParties();
  } catch (error) {
    console.error("Error with /POST addParty function : ", error);
  }
}

/** Update an event */
async function updateParty(id, updatedEvent) {
  try {
    await fetch(`${API}/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEvent),
    });
    // Refresh data
    await getParties();
    if (selectedParty && selectedParty.id === id) {
      await getParty(id);
    }
  } catch (error) {
    console.error("Error with /PUT updateParty function : ", error);
  }
}

/** Delete an event */
async function deleteParty(id) {
  try {
    await fetch(`${API}/events/${id}`, {
      method: "DELETE",
    });
    // Set selectedParty back to null so user has to pick a new event
    selectedParty = null;
    getParties();
  } catch (error) {
    console.error("Error with /DELETE deleteParty functinon : ", error);
  }
}

/** Updates state with all RSVPs from the API */
async function getRsvps() {
  try {
    const response = await fetch(API + "/rsvps");
    const result = await response.json();
    rsvps = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

/** Updates state with all guests from the API */
async function getGuests() {
  try {
    const response = await fetch(API + "/guests");
    const result = await response.json();
    guests = result.data;
    render();
  } catch (e) {
    console.error(e);
  }
}

// === Components ===

/** Party name that shows more details about the party when clicked */
function PartyListItem(party) {
  const $li = document.createElement("li");

  if (party.id === selectedParty?.id) {
    $li.classList.add("selected");
  }

  $li.innerHTML = `
    <a href="#selected">${party.name}</a>
  `;
  $li.addEventListener("click", () => getParty(party.id));
  return $li;
}

/** A list of names of all parties */
function PartyList() {
  const $ul = document.createElement("ul");
  $ul.classList.add("parties");

  const $parties = parties.map(PartyListItem);
  $ul.replaceChildren(...$parties);

  return $ul;
}

/** Detailed information about the selected party */
function SelectedParty() {
  if (!selectedParty) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a party to learn more.";
    return $p;
  }

  const $party = document.createElement("section");
  $party.innerHTML = `
    <h3>${selectedParty.name} #${selectedParty.id}</h3>
    <time datetime="${selectedParty.date}">
      ${selectedParty.date.slice(0, 10)}
    </time>
    <address>${selectedParty.location}</address>
    <p>${selectedParty.description}</p>
    <GuestList></GuestList>
    <form class="edit-form" hidden>
      <label>
        Name
        <input name="name" type="text" placeholder="Name"/>
      </label>
      <label>
        Date
        <input name="date" type="date" placeholder="Date"/>
      </label>
      <label>
        Description
        <input name="description" type="text" placeholder="Description"/>
      </label>
      <label>
        Location
        <input name="location" type="text" placeholder="Location"/>
      </label>
    </form>
    <button class="edit-save-btn" data-action="edit" data-id=${selectedParty.id}>Edit</button>
    <button class="delete-btn">Delete</button>
  `;
  $party.querySelector("GuestList").replaceWith(GuestList());

  // Logic to edit an event
  const $editSaveBtn = $party.querySelector(".edit-save-btn");
  const $form = $party.querySelector(".edit-form");
  $editSaveBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    // Store the id of current event so can target for update if needed
    const id = Number(event.currentTarget.dataset.id);
    // Store the value of data-action (edit) in variable action
    const action = event.currentTarget.dataset.action;

    if (action === "edit") {
      $form.hidden = false;
      event.currentTarget.dataset.action = "save";
      event.currentTarget.textContent = "Save";
      return;
    }

    if (action === "save") {
      const data = new FormData($form);
      const updatedEvent = {
        name: data.get("name"),
        date: new Date(data.get("date")).toISOString(),
        description: data.get("description"),
        location: data.get("location"),
      };
      event.currentTarget.dataset.action = "edit";
      event.currentTarget.textContent = "Edit";
      $form.hidden = true;
      await updateParty(id, updatedEvent);
    }
  });

  // Logic to delete an event
  const $delete = $party.querySelector(".delete-btn");
  $delete.addEventListener("click", async function (event) {
    event.preventDefault();
    deleteParty(selectedParty.id);
  });

  return $party;
}

function AddNewPartyForm() {
  const $form = document.createElement("form");
  $form.classList.add("new-party-form");
  // Creating structure of AddNewPartyForm
  $form.innerHTML = `
    <label>
      Name
      <input name="name" type="text" placeholder="Name"/>
    </label>
    <label>
      Date
      <input name="date" type="date" placeholder="Date"/>
    </label>
    <label>
      Description
      <input name="description" type="text" placeholder="Description"/>
    </label>
    <label>
      Location
      <input name="location" type="text" placeholder="Location"/>
    </label>
    <button>Add New Party</button>
  `;

  // Now that a button [Add New Party] is created - Need to have a response to interaction
  $form.addEventListener("submit", function (event) {
    event.preventDefault();
    // Create an obj to collect all the data
    const data = new FormData($form);
    // Grapping info from data and organising them into a new object with only desired info
    const newParty = {
      name: data.get("name"),
      date: new Date(data.get("date")).toISOString(),
      description: data.get("description"),
      location: data.get("location"),
    };
    // Call addParty function and pass the newParty obj as the parameter
    addParty(newParty);
    // Reset form
    $form.reset;
  });

  return $form;
}

/** List of guests attending the selected party */
function GuestList() {
  const $ul = document.createElement("ul");
  const guestsAtParty = guests.filter((guest) =>
    rsvps.find((rsvp) => rsvp.guestId === guest.id && rsvp.eventId === selectedParty.id)
  );

  // Simple components can also be created anonymously:
  const $guests = guestsAtParty.map((guest) => {
    const $guest = document.createElement("li");
    $guest.textContent = guest.name;
    return $guest;
  });
  $ul.replaceChildren(...$guests);

  return $ul;
}

// === Render ===
function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
    <h1>Party Planner</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <PartyList></PartyList>
      </section>
      <section id="selected">
        <h2>Party Details</h2>
        <SelectedParty></SelectedParty>
      </section>
      <section>
        <h2>Add A New Party<h2>
        <AddNewPartyForm></AddNewPartyForm>
      </section>
    </main>
  `;

  $app.querySelector("PartyList").replaceWith(PartyList());
  $app.querySelector("SelectedParty").replaceWith(SelectedParty());
  $app.querySelector("AddNewPartyForm").replaceWith(AddNewPartyForm());
}

async function init() {
  await Promise.all([getParties(), getRsvps(), getGuests()]);
  render();
}

init();
