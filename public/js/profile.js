var currentUploadType = '';

function openUploadModal(type) {
  currentUploadType = type;
  $('#uploadModal').modal('show');
}

function deleteDocument(type) {
    if (confirm('Are you sure you want to delete this document?')) {
        $.ajax({
            url: '/api/delete-document',
            type: 'POST',
            data: { type: type },
            success: function(response) {
                location.reload();
            },
            error: function(xhr) {
                alert('Delete failed: ' + xhr.responseText);
            }
        });
    }
}

$(document).ready(function() {
    $('#uploadForm').on('submit', function(e) {
      e.preventDefault();
      var formData = new FormData(this);
      formData.append('type', currentUploadType);
      $.ajax({
        url: '/api/upload-document',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
          // success
          location.reload();
        },
        error: function(xhr) {
          alert('Upload failed: ' + xhr.responseText);
        }
      });
    });
});
