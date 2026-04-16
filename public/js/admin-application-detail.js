document.addEventListener('DOMContentLoaded', function () {
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize modals to ensure they work properly
    var modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(function (modalEl) {
        new bootstrap.Modal(modalEl, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    });

    // Handle delete confirmation checkbox
    const confirmDelete = document.getElementById('confirmDelete');
    const deleteButton = document.getElementById('deleteButton');

    if (confirmDelete && deleteButton) {
        confirmDelete.addEventListener('change', function () {
            deleteButton.disabled = !this.checked;
        });
    }

    // Add loading state to form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            }
        });
    });
});
