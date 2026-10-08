document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load activities (${response.status})`);
      }

      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants</h5>
          </div>
        `;

        const participantsSection = activityCard.querySelector(".participants-section");
        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";
          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.textContent = participant;

            const unregisterButton = document.createElement("button");
            unregisterButton.className = "unregister-button";
            unregisterButton.type = "button";
            unregisterButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            unregisterButton.dataset.activity = name;
            unregisterButton.dataset.email = participant;
            unregisterButton.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m5 4v6m4-6v6" />
              </svg>
            `;

            listItem.append(participantEmail, unregisterButton);
            participantsList.appendChild(listItem);
          });
          participantsSection.appendChild(participantsList);
        } else {
          const emptyState = document.createElement("p");
          emptyState.className = "participants-empty";
          emptyState.textContent = "No participants yet";
          participantsSection.appendChild(emptyState);
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const unregisterButton = event.target.closest(".unregister-button");
    if (!unregisterButton) {
      return;
    }

    unregisterButton.disabled = true;
    const { activity, email } = unregisterButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        messageDiv.textContent = result.detail || "Unable to unregister this participant.";
        messageDiv.className = "error";
      } else {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
      }
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    }

    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Initialize app
  fetchActivities();
});
