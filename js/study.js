/* =========================================
   STUDY TAB CONTENT LOGIC
   ========================================= */

// 1. DUMMY DATA (Yahan aap baad me asli links dalenge)
const studyMaterial = {
    notes: [
        { title: "History: Indus Valley Civ.", type: "PDF", size: "2.4 MB" },
        { title: "Physics: Motion Formulas", type: "PDF", size: "1.1 MB" },
        { title: "Maths: Trigonometry Sheets", type: "PDF", size: "3.5 MB" },
        { title: "Chemistry: Periodic Table", type: "IMG", size: "500 KB" }
    ],
    books: [
        { title: "NCERT Class 10 Science", type: "E-Book", size: "15 MB" },
        { title: "Laxmikant Polity (Summary)", type: "E-Book", size: "8 MB" }
    ],
    videos: [
        { title: "Complete Algebra in 1 Shot", type: "Video", size: "2 hrs" },
        { title: "Modern History Timeline", type: "Video", size: "45 mins" }
    ]
};

// 2. POPULATE LISTS ON LOAD
// Jaise hi app khulega, ye code list bana kar ready rakhega
document.addEventListener('DOMContentLoaded', () => {
    
    // Notes List Load karo
    renderList('notes', 'notes-list-container');
    
    // Aap chaho to Books aur Videos ke liye bhi container bana kar yahan call kar sakte ho
    // Example: renderList('books', 'books-list-container');
});

// 3. RENDER FUNCTION (HTML Generator)
function renderList(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // Agar HTML me container nahi mila to ruk jao

    const items = studyMaterial[category];
    
    // Purana content saaf karo
    container.innerHTML = '';

    // Loop chala kar HTML banao
    items.forEach(item => {
        // Icon decide karo
        let iconClass = 'bi-file-earmark-text';
        let colorClass = 'text-primary';
        
        if (item.type === 'Video') { iconClass = 'bi-play-circle-fill'; colorClass = 'text-danger'; }
        if (item.type === 'E-Book') { iconClass = 'bi-book-half'; colorClass = 'text-success'; }

        // HTML String
        const html = `
            <div class="pdf-list-item" onclick="openMaterial('${item.title}')">
                <div class="pdf-icon-box">
                    <i class="bi ${iconClass} ${colorClass}"></i>
                </div>
                <div class="pdf-info">
                    <h6>${item.title}</h6>
                    <small>${item.type} • ${item.size}</small>
                </div>
                <div class="ms-auto">
                    <i class="bi bi-download text-muted"></i>
                </div>
            </div>
        `;
        
        // Add to container
        container.innerHTML += html;
    });
}

// 4. CLICK HANDLER
function openMaterial(title) {
    // Filhal bas alert dikhayenge
    alert("Opening: " + title + "\n(Backend connect hone par file khulegi)");
}
