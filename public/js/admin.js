/**
 * UdyamKings - Admin Dashboard JavaScript
 * Handles admin panel interactions and functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const datatables = [];
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('active');
        });
    }
    
    // Initialize DataTables if available
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        const dt = $('.datatable').DataTable({
            responsive: true,
            pageLength: 25,
            order: [[0, 'desc']],
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "No entries found",
                infoFiltered: "(filtered from _MAX_ total entries)",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                },
                loadingRecords: "Loading...",
                processing: "Processing...",
                zeroRecords: "No matching records found"
            },
            dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            initComplete: function() {
                // Add custom class to search input
                $('.dataTables_filter input').addClass('form-control');
                $('.dataTables_length select').addClass('form-select form-select-sm');
            }
        });

        datatables.push(dt);
    }

    // Handle viewport changes (DevTools open/close changes layout width)
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            try {
                datatables.forEach(function(dt) {
                    if (dt && dt.columns) {
                        dt.columns.adjust();
                    }
                    if (dt && dt.responsive && dt.responsive.recalc) {
                        dt.responsive.recalc();
                    }
                });

                if (typeof Chart !== 'undefined' && Chart.instances) {
                    Object.keys(Chart.instances).forEach(function(key) {
                        const chart = Chart.instances[key];
                        if (chart && typeof chart.resize === 'function') {
                            chart.resize();
                        }
                    });
                }
            } catch (e) {
                // ignore
            }
        }, 150);
    });
    
    // Initialize Select2 if available
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $('.select2').select2({
            theme: 'bootstrap-5',
            width: '100%'
        });
    }
    
    // Initialize Summernote if available
    if (typeof $ !== 'undefined' && $.fn.summernote) {
        $('.summernote').summernote({
            height: 300,
            minHeight: 200,
            maxHeight: 600,
            focus: true,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ]
        });
    }
    
    // Initialize Flatpickr for date pickers if available
    if (typeof flatpickr !== 'undefined') {
        flatpickr('.datepicker', {
            dateFormat: 'Y-m-d',
            allowInput: true
        });
        
        flatpickr('.datetimepicker', {
            enableTime: true,
            dateFormat: 'Y-m-d H:i',
            time_24hr: true,
            allowInput: true
        });
    }
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            
            if (targetInput) {
                const type = targetInput.getAttribute('type') === 'password' ? 'text' : 'password';
                targetInput.setAttribute('type', type);
                
                // Toggle icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
    
    // Handle bulk actions
    const selectAllCheckbox = document.getElementById('selectAll');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    const bulkActionForm = document.getElementById('bulkActionForm');
    const bulkActionSelect = document.getElementById('bulkAction');
    
    if (selectAllCheckbox && itemCheckboxes.length > 0) {
        // Select all checkboxes
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            itemCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            updateBulkActionButtons();
        });
        
        // Update select all checkbox when individual checkboxes change
        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allChecked = document.querySelectorAll('.item-checkbox:checked').length === itemCheckboxes.length;
                selectAllCheckbox.checked = allChecked;
                updateBulkActionButtons();
            });
        });
        
        // Update bulk action buttons state
        function updateBulkActionButtons() {
            const selectedCount = document.querySelectorAll('.item-checkbox:checked').length;
            const bulkActionButtons = document.querySelectorAll('.bulk-action-btn');
            
            bulkActionButtons.forEach(button => {
                if (selectedCount > 0) {
                    button.disabled = false;
                } else {
                    button.disabled = true;
                }
            });
            
            // Update selected count
            const selectedCountElement = document.getElementById('selectedCount');
            if (selectedCountElement) {
                selectedCountElement.textContent = selectedCount;
            }
        }
    }
    
    // Handle bulk action form submission
    if (bulkActionForm && bulkActionSelect) {
        bulkActionForm.addEventListener('submit', function(e) {
            const selectedAction = bulkActionSelect.value;
            const selectedItems = Array.from(document.querySelectorAll('.item-checkbox:checked'));
            
            if (selectedItems.length === 0) {
                e.preventDefault();
                showAlert('warning', 'Please select at least one item to perform this action.');
                return false;
            }
            
            if (selectedAction === '') {
                e.preventDefault();
                showAlert('warning', 'Please select an action to perform.');
                return false;
            }
            
            // Add confirmation for destructive actions
            const destructiveActions = ['delete', 'reject'];
            if (destructiveActions.includes(selectedAction)) {
                const actionName = selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1);
                if (!confirm(`Are you sure you want to ${selectedAction} ${selectedItems.length} selected item(s)? This action cannot be undone.`)) {
                    e.preventDefault();
                    return false;
                }
            }
            
            // Add selected items to form data
            const selectedIds = selectedItems.map(checkbox => checkbox.value);
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'selected_ids';
            hiddenInput.value = JSON.stringify(selectedIds);
            this.appendChild(hiddenInput);
            
            return true;
        });
    }
    
    // Handle file upload preview for images
    const fileInputs = document.querySelectorAll('.file-upload-input');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            const previewId = this.getAttribute('data-preview');
            const previewElement = document.getElementById(previewId);
            const defaultText = this.nextElementSibling;
            
            if (file && previewElement) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewElement.src = e.target.result;
                    previewElement.style.display = 'block';
                    
                    if (defaultText) {
                        defaultText.style.display = 'none';
                    }
                }
                
                reader.readAsDataURL(file);
            }
        });
    });
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    // Handle modal form submissions
    const modalForms = document.querySelectorAll('.modal-form');
    modalForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
            }
            
            try {
                const formData = new FormData(this);
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    showAlert('success', data.message || 'Operation completed successfully!');
                    
                    // Close modal if specified
                    if (this.hasAttribute('data-close-modal')) {
                        const modalId = this.getAttribute('data-close-modal');
                        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
                        if (modal) {
                            modal.hide();
                        }
                    }
                    
                    // Reload page or update content if needed
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else if (this.hasAttribute('data-reload')) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } else {
                    showAlert('danger', data.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('danger', 'An error occurred. Please try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    });
    
    // Handle status toggles
    const statusToggles = document.querySelectorAll('.status-toggle');
    statusToggles.forEach(toggle => {
        toggle.addEventListener('change', async function() {
            const url = this.getAttribute('data-url');
            const checked = this.checked;
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        status: checked ? 'active' : 'inactive',
                        _method: 'PATCH'
                    })
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    // Revert toggle if update failed
                    this.checked = !checked;
                    showAlert('danger', data.message || 'Failed to update status.');
                } else {
                    showAlert('success', data.message || 'Status updated successfully!');
                }
            } catch (error) {
                console.error('Error:', error);
                this.checked = !checked; // Revert on error
                showAlert('danger', 'An error occurred. Please try again.');
            }
        });
    });
    
    // Handle delete confirmations
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const deleteUrl = this.getAttribute('href') || this.getAttribute('data-url');
            const message = this.getAttribute('data-message') || 'Are you sure you want to delete this item? This action cannot be undone.';
            
            if (confirm(message)) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = deleteUrl;
                
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                }
                
                const methodInput = document.createElement('input');
                methodInput.type = 'hidden';
                methodInput.name = '_method';
                methodInput.value = 'DELETE';
                form.appendChild(methodInput);
                
                document.body.appendChild(form);
                form.submit();
            }
        });
    });
    
    // Initialize chart if Chart.js is available
    if (typeof Chart !== 'undefined') {
        const ctx = document.getElementById('dashboardChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Applications',
                        data: [12, 19, 3, 5, 2, 3, 10, 15, 20, 25, 30, 35],
                        backgroundColor: 'rgba(10, 36, 99, 0.1)',
                        borderColor: 'rgba(10, 36, 99, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }, {
                        label: 'Approved',
                        data: [8, 12, 2, 3, 1, 2, 7, 10, 15, 18, 22, 28],
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 5
                            }
                        }
                    }
                }
            });
        }
    }
});

// Show Alert Message
function showAlert(type, message, container = '.content-wrapper', dismissible = true) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} ${dismissible ? 'alert-dismissible fade show' : ''} mb-4`;
    alertDiv.role = 'alert';
    
    alertDiv.innerHTML = `
        ${message}
        ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : ''}
    `;
    
    const targetContainer = container === 'body' ? document.body : document.querySelector(container);
    
    if (targetContainer) {
        // Remove any existing alerts
        const existingAlerts = targetContainer.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Add new alert
        const content = targetContainer.querySelector('.content-header');
        if (content && content.nextElementSibling) {
            targetContainer.insertBefore(alertDiv, content.nextElementSibling);
        } else {
            targetContainer.prepend(alertDiv);
        }
        
        // Auto-dismiss after 5 seconds
        if (dismissible) {
            setTimeout(() => {
                if (alertDiv) {
                    const bsAlert = new bootstrap.Alert(alertDiv);
                    bsAlert.close();
                }
            }, 5000);
        }
    }
}

// Handle form submissions with AJAX
async function handleFormSubmit(form, options = {}) {
    const {
        method = 'POST',
        successMessage = 'Operation completed successfully!',
        errorMessage = 'An error occurred. Please try again.',
        onSuccess = null,
        onError = null,
        resetForm = true,
        redirect = null
    } = options;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        }
        
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: method,
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('success', data.message || successMessage);
            
            if (resetForm) {
                form.reset();
            }
            
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(data);
            }
            
            if (redirect) {
                setTimeout(() => {
                    window.location.href = redirect;
                }, 1500);
            } else if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            }
            
            return data;
        } else {
            let errorMsg = errorMessage;
            
            if (data.errors) {
                // Handle validation errors
                errorMsg = '';
                for (const field in data.errors) {
                    errorMsg += `${data.errors[field].join('<br>')}<br>`;
                    
                    // Highlight error fields
                    const input = form.querySelector(`[name="${field}"]`);
                    if (input) {
                        input.classList.add('is-invalid');
                        
                        // Add error message below the input
                        let errorDiv = input.nextElementSibling;
                        if (!errorDiv || !errorDiv.classList.contains('invalid-feedback')) {
                            errorDiv = document.createElement('div');
                            errorDiv.className = 'invalid-feedback';
                            input.parentNode.insertBefore(errorDiv, input.nextSibling);
                        }
                        errorDiv.innerHTML = data.errors[field].join('<br>');
                    }
                }
            }
            
            showAlert('danger', errorMsg);
            
            if (onError && typeof onError === 'function') {
                onError(data);
            }
            
            return data;
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('danger', errorMessage);
        
        if (onError && typeof onError === 'function') {
            onError(error);
        }
        
        return { success: false, message: errorMessage };
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Initialize form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Handle AJAX forms
    const ajaxForms = document.querySelectorAll('form[data-ajax="true"]');
    ajaxForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleFormSubmit(this, {
                method: this.getAttribute('method') || 'POST',
                successMessage: this.getAttribute('data-success-message') || 'Operation completed successfully!',
                errorMessage: this.getAttribute('data-error-message') || 'An error occurred. Please try again.',
                resetForm: this.hasAttribute('data-reset-form'),
                redirect: this.getAttribute('data-redirect') || null
            });
        });
    });
    
    // Remove error classes and messages when input changes
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            
            const errorDiv = this.nextElementSibling;
            if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
                errorDiv.remove();
            }
        });
    });
});

// Export functions for global access
window.Admin = {
    showAlert,
    handleFormSubmit
};
