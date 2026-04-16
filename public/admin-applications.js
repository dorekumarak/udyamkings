// Bulk selection functions
function toggleSelectAll() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.app-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
  });
  updateBulkActions();
}

function updateBulkActions() {
  const checkboxes = document.querySelectorAll('.app-checkbox:checked');
  const bulkActions = document.getElementById('bulkActions');
  const selectedCount = document.getElementById('selectedCount');
  const selectAll = document.getElementById('selectAll');
  
  const count = checkboxes.length;
  selectedCount.textContent = count + ' application' + (count !== 1 ? 's' : '') + ' selected';
  
  if (count > 0) {
    bulkActions.style.display = 'block';
  } else {
    bulkActions.style.display = 'none';
  }
  
  // Update select all checkbox
  const allCheckboxes = document.querySelectorAll('.app-checkbox');
  selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
}

function clearSelection() {
  const checkboxes = document.querySelectorAll('.app-checkbox');
  const selectAll = document.getElementById('selectAll');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  selectAll.checked = false;
  updateBulkActions();
}

function getSelectedApplications() {
  const checkboxes = document.querySelectorAll('.app-checkbox:checked');
  const applications = [];
  
  checkboxes.forEach(checkbox => {
    const appId = checkbox.value;
    const row = document.getElementById('app-' + appId);
    if (row) {
      const cells = row.getElementsByTagName('td');
      applications.push({
        id: appId,
        applicant: cells[2].innerText,
        business: cells[3].innerText,
        amount: cells[4].innerText,
        status: cells[5].querySelector('.status-badge').textContent,
        documents: Array.from(row.querySelectorAll('.doc-name')).map(doc => doc.textContent)
      });
    }
  });
  
  return applications;
}

function exportSelectedApplications() {
  const applications = getSelectedApplications();
  
  if (applications.length === 0) {
    alert('No applications selected for export');
    return;
  }
  
  // Create CSV content
  let csvContent = 'ID,Applicant,Business,Amount,Status,Documents\n';
  applications.forEach(app => {
    csvContent += app.id + ',"' + app.applicant + '","' + app.business + '","' + app.amount + '","' + app.status + '","' + app.documents.join('; ') + '"\n';
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'applications_backup_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  alert('Exported ' + applications.length + ' application' + (applications.length !== 1 ? 's' : '') + ' to CSV file');
}

function deleteSelectedApplications() {
  const applications = getSelectedApplications();
  
  if (applications.length === 0) {
    alert('No applications selected for deletion');
    return;
  }
  
  const appList = applications.map(app => '#' + app.id + ' - ' + app.applicant).join('\n');
  const confirmMessage = 'Are you sure you want to delete the following ' + applications.length + ' application' + (applications.length !== 1 ? 's' : '') + '?\n\n' + appList + '\n\nThis action cannot be undone. Make sure you have exported the data first.';
  
  if (confirm(confirmMessage)) {
    // Call API to delete applications
    const deletePromises = applications.map(app => {
      return fetch('/api/admin/application/' + app.id, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });
    
    Promise.all(deletePromises)
      .then(responses => Promise.all(responses.map(r => r.json())))
      .then(results => {
        const successful = results.filter(r => r.success).length;
        alert('Successfully deleted ' + successful + ' out of ' + applications.length + ' application' + (applications.length !== 1 ? 's' : ''));
        
        // Remove deleted rows from UI
        applications.forEach(app => {
          const row = document.getElementById('app-' + app.id);
          if (row) {
            row.remove();
          }
        });
        
        // Clear selection and update UI
        clearSelection();
      })
      .catch(error => {
        console.error('Error deleting applications:', error);
        alert('Error deleting applications. Please try again.');
      });
  }
}

function acceptApplication(id) {
  if (confirm('Are you sure you want to accept this application?')) {
    fetch('/api/admin/application/' + id + '/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Update status badge
        const statusBadge = document.querySelector('#app-' + id + ' .status-badge');
        if (statusBadge) {
          statusBadge.className = 'status-badge status-approved';
          statusBadge.textContent = 'Approved';
        }
        // Update action buttons - show reset button, hide accept/reject
        const actionCell = document.querySelector('#app-' + id + ' td:last-child');
        if (actionCell) {
          actionCell.innerHTML = '<div class="action-buttons"><button class="btn btn-warning" onclick="viewDetails(' + id + ')">👁️ View</button><button class="btn btn-primary" onclick="resetApplication(' + id + ')">🔄 Reset</button></div>';
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to accept application');
    });
  }
}

function rejectApplication(id) {
  if (confirm('Are you sure you want to reject this application?')) {
    fetch('/api/admin/application/' + id + '/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Update status badge
        const statusBadge = document.querySelector('#app-' + id + ' .status-badge');
        if (statusBadge) {
          statusBadge.className = 'status-badge status-rejected';
          statusBadge.textContent = 'Rejected';
        }
        // Update action buttons - show reset button, hide accept/reject
        const actionCell = document.querySelector('#app-' + id + ' td:last-child');
        if (actionCell) {
          actionCell.innerHTML = '<div class="action-buttons"><button class="btn btn-warning" onclick="viewDetails(' + id + ')">👁️ View</button><button class="btn btn-primary" onclick="resetApplication(' + id + ')">🔄 Reset</button></div>';
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to reject application');
    });
  }
}

function viewDetails(id) {
  alert('Viewing detailed information for application #' + id);
  // Here you could open a modal with full application details
}

function viewCompressedDocument(type, appId) {
  // Simulate viewing compressed document
  alert('Viewing compressed ' + type + ' document for application #' + appId + '\n\nDocument Quality: High\nFile Size: Optimized for web viewing\nCompression: Lossless to maintain readability');
}

function downloadDocument(type, appId, version) {
  // Simulate downloading document
  alert('Downloading ' + version + ' ' + type + ' document for application #' + appId + '\n\nFile will be downloaded to your device');
}

function deleteDocument(type, appId) {
  if (confirm('Are you sure you want to delete this ' + type + ' document?\n\nThis will only remove the document, not the application details.')) {
    fetch('/api/admin/application/' + appId + '/documents/' + type, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Remove the document item from the UI
        const docItems = document.querySelectorAll('.doc-item');
        docItems.forEach(item => {
          const docName = item.querySelector('.doc-name');
          if (docName && docName.textContent.toLowerCase().includes(type.toLowerCase())) {
            item.style.display = 'none';
          }
        });
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete document');
    });
  }
}

function resetApplication(id) {
  if (confirm('Are you sure you want to reset this application to pending status?')) {
    fetch('/api/admin/application/' + id + '/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Update status badge
        const statusBadge = document.querySelector('#app-' + id + ' .status-badge');
        if (statusBadge) {
          statusBadge.className = 'status-badge status-pending';
          statusBadge.textContent = 'Pending';
        }
        // Update action buttons - show accept/reject, hide reset
        const actionCell = document.querySelector('#app-' + id + ' td:last-child');
        if (actionCell) {
          actionCell.innerHTML = '<div class="action-buttons"><button class="btn btn-success" onclick="acceptApplication(' + id + ')">✓ Accept</button><button class="btn btn-danger" onclick="rejectApplication(' + id + ')">✗ Reject</button><button class="btn btn-warning" onclick="viewDetails(' + id + ')">👁️ View</button></div>';
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to reset application');
    });
  }
}

function viewDocument(type, appId) {
  // Open the document in a new window directly
  window.open('/api/admin/application/' + appId + '/documents/' + type, '_blank');
}

function deleteApplication(id) {
  console.log('DELETE APPLICATION CALLED FOR ID:', id);
  if (confirm('Are you sure you want to delete this application?')) {
    console.log('SENDING DELETE REQUEST FOR ID:', id);
    fetch('/api/admin/application/' + id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('DELETE RESPONSE:', data);
      if (data.success) {
        alert(data.message);
        location.reload();
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to delete application');
    });
  }
}

function exportApplications() {
  fetch('/api/admin/applications/export')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message + '\nDownload URL: ' + data.downloadUrl);
        // Here you could trigger actual download
        // window.open(data.downloadUrl, '_blank');
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to export applications');
    });
}

function sendNotifications() {
  alert('Opening notification center...');
  // Here you could navigate to notifications page
}

function systemMaintenance() {
  alert('Opening system maintenance panel...');
  // Here you could navigate to maintenance page
}

function generateReports() {
  fetch('/api/admin/reports/generate')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message + '\n\nReport Data:\n' + 
              'Total Applications: ' + data.data.totalApplications + '\n' +
              'Pending: ' + data.data.pendingApplications + '\n' +
              'Approved: ' + data.data.approvedApplications + '\n' +
              'Rejected: ' + data.data.rejectedApplications + '\n' +
              'Total Funding: ₹' + data.data.totalFunding.toLocaleString());
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to generate reports');
    });
}

function userManagement() {
  window.location.href = '/admin/users';
}

function systemSettings() {
  alert('Opening system settings...');
  // Here you could navigate to settings page
}
