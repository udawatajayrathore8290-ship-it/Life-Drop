let donors = [];

const donorForm = document.getElementById("donorForm");
const donorTable = document.getElementById("donorTable");
const searchInput = document.getElementById("searchInput");

donorForm.addEventListener("submit", function(e){

    e.preventDefault();

    const donor = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        bloodGroup: document.getElementById("bloodGroup").value,
        city: document.getElementById("city").value,
        mobile: document.getElementById("mobile").value,
        lastDonation: document.getElementById("lastDonation").value || "N/A"
    };

    donors.push(donor);

    renderTable();

    donorForm.reset();

});

function renderTable(filtered = donors){

    donorTable.innerHTML = "";

    filtered.forEach((donor,index)=>{

        donorTable.innerHTML += `
        <tr>
            <td>${donor.name}</td>
            <td>${donor.age}</td>
            <td>${donor.bloodGroup}</td>
            <td>${donor.city}</td>
            <td>${donor.mobile}</td>
            <td>${donor.lastDonation}</td>
            <td>
                <button class="delete-btn"
                onclick="deleteDonor(${index})">
                Delete
                </button>
            </td>
        </tr>
        `;
    });
}

function deleteDonor(index){
    donors.splice(index,1);
    renderTable();
}

searchInput.addEventListener("keyup", ()=>{

    const value = searchInput.value.toLowerCase();

    const filtered = donors.filter(donor =>
        donor.name.toLowerCase().includes(value) ||
        donor.bloodGroup.toLowerCase().includes(value) ||
        donor.city.toLowerCase().includes(value)
    );

    renderTable(filtered);
});
