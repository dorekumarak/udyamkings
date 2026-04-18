document.addEventListener('DOMContentLoaded', async () => {
    const formConfigsContainer = document.getElementById('form-configs');
    const addFieldBtn = document.getElementById('add-field');
    const saveOrderBtn = document.getElementById('save-order');
    const modal = document.getElementById('field-modal');
    const closeModal = document.querySelector('.close');
    const cancelEdit = document.getElementById('cancel-edit');
    const fieldForm = document.getElementById('field-form');
    const modalTitle = document.getElementById('modal-title');
    const fieldTypeSelect = document.getElementById('field-type');
    const optionsGroup = document.getElementById('options-group');
    
    let currentEditId = null;

    // Load form configurations
    async function loadFormConfigs() {
        try {
            const response = await fetch('/api/admin/form-config');
            const configs = await response.json();
            renderFormConfigs(configs);
            initSortable();
        } catch (error) {
            console.error('Error loading form configs:', error);
            showNotification('Error loading form configurations', 'error');
        }
    }

    // Render form configurations
    function renderFormConfigs(configs) {
        formConfigsContainer.innerHTML = '';
        configs.forEach(config => {
            const configElement = createConfigElement(config);
            formConfigsContainer.appendChild(configElement);
        });
    }

    // Create config element
    function createConfigElement(config) {
        const element = document.createElement('div');
        element.className = 'form-config-item';
        element.dataset.id = config.id;
        element.draggable = true;
        
        element.innerHTML = `
            <div class="config-header">
                <span class="handle">☰</span>
                <h3>${config.field_label} (${config.field_name})</h3>
                <div class="actions">
                    <button class="edit-btn" data-id="${config.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" data-id="${config.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="config-details" style="display: none;">
                <p><strong>Type:</strong> ${config.field_type}</p>
                <p><strong>Required:</strong> ${config.is_required ? 'Yes' : 'No'}</p>
                ${config.options ? `<p><strong>Options:</strong> ${JSON.stringify(config.options)}</p>` : ''}
            </div>
        `;

        // Add event listeners
        const header = element.querySelector('.config-header');
        const editBtn = element.querySelector('.edit-btn');
        const deleteBtn = element.querySelector('.delete-btn');
        
        header.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                const details = element.querySelector('.config-details');
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
            }
        });

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editConfig(config.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
                deleteConfig(config.id);
            }
        });

        return element;
    }

    // Initialize sortable
    function initSortable() {
        new Sortable(formConfigsContainer, {
            animation: 150,
            handle: '.handle',
            ghostClass: 'sortable-ghost',
            onEnd: updateDisplayOrder
        });
    }

    // Update display order
    async function updateDisplayOrder() {
        const configs = Array.from(formConfigsContainer.children).map((el, index) => ({
            id: parseInt(el.dataset.id),
            display_order: index
        }));

        try {
            await fetch('/api/admin/form-config/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ configs })
            });
            showNotification('Display order updated successfully');
        } catch (error) {
            console.error('Error updating display order:', error);
            showNotification('Error updating display order', 'error');
        }
    }

    // Show add field modal
    function showAddFieldModal() {
        currentEditId = null;
        modalTitle.textContent = 'Add New Field';
        fieldForm.reset();
        document.getElementById('field-type').dispatchEvent(new Event('change'));
        modal.style.display = 'block';
    }

    // Edit config
    async function editConfig(id) {
        try {
            const response = await fetch(`/api/admin/form-config/${id}`);
            const config = await response.json();
            
            currentEditId = id;
            modalTitle.textContent = 'Edit Field';
            
            // Fill the form
            document.getElementById('field-name').value = config.field_name;
            document.getElementById('field-label').value = config.field_label;
            document.getElementById('field-type').value = config.field_type;
            document.getElementById('is-required').checked = config.is_required;
            document.getElementById('field-order').value = config.display_order || 0;
            
            // Handle options for select/radio/checkbox
            if (config.options) {
                const optionsText = config.options
                    .map(opt => `${opt.value}:${opt.label || opt.value}`)
                    .join('\n');
                document.getElementById('field-options').value = optionsText;
            }
            
            // Show options group if needed
            document.getElementById('field-type').dispatchEvent(new Event('change'));
            
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading field for edit:', error);
            showNotification('Error loading field for editing', 'error');
        }
    }

    // Delete config
    async function deleteConfig(id) {
        try {
            const response = await fetch(`/api/admin/form-config/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Field deleted successfully');
                loadFormConfigs();
            } else {
                throw new Error('Failed to delete field');
            }
        } catch (error) {
            console.error('Error deleting field:', error);
            showNotification('Error deleting field', 'error');
        }
    }

    // Save field
    async function saveField(e) {
        e.preventDefault();
        
        const formData = {
            field_name: document.getElementById('field-name').value.trim(),
            field_label: document.getElementById('field-label').value.trim(),
            field_type: document.getElementById('field-type').value,
            is_required: document.getElementById('is-required').checked,
            display_order: parseInt(document.getElementById('field-order').value) || 0,
            validation_rules: {},
            options: []
        };
        
        // Handle options for select/radio/checkbox
        if (['select', 'radio', 'checkbox'].includes(formData.field_type)) {
            const optionsText = document.getElementById('field-options').value.trim();
            if (optionsText) {
                formData.options = optionsText.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const [value, label] = line.split(':').map(s => s.trim());
                        return { value, label: label || value };
                    });
            }
        }
        
        // Set validation rules based on field type
        if (formData.field_type === 'number') {
            formData.validation_rules = {
                min: 0
            };
        } else if (formData.field_type === 'email') {
            formData.validation_rules = {
                pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
            };
        }
        
        try {
            const url = currentEditId 
                ? `/api/admin/form-config/${currentEditId}`
                : '/api/admin/form-config';
                
            const method = currentEditId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save field');
            }
            
            showNotification(`Field ${currentEditId ? 'updated' : 'created'} successfully`);
            modal.style.display = 'none';
            loadFormConfigs();
        } catch (error) {
            console.error('Error saving field:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Toggle options field based on field type
    function toggleOptionsField() {
        const showOptions = ['select', 'radio', 'checkbox'].includes(fieldTypeSelect.value);
        optionsGroup.style.display = showOptions ? 'block' : 'none';
    }

    // Event Listeners
    addFieldBtn.addEventListener('click', showAddFieldModal);
    saveOrderBtn.addEventListener('click', updateDisplayOrder);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    cancelEdit.addEventListener('click', () => modal.style.display = 'none');
    fieldForm.addEventListener('submit', saveField);
    fieldTypeSelect.addEventListener('change', toggleOptionsField);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initial load
    loadFormConfigs();
});
