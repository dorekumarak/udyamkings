document.addEventListener('DOMContentLoaded', function () {
  if (typeof $ === 'undefined' || !$.fn || !$.fn.DataTable) return;

  const tableEl = document.getElementById('applicationsTable');
  if (!tableEl) return;

  const existing = $.fn.DataTable.isDataTable(tableEl);
  if (!existing) {
    $(tableEl).DataTable({
      responsive: {
        details: {
          type: 'column',
          target: -1
        }
      },
      pageLength: 25,
      order: [[1, 'desc']], // Sort by ID column (index 1)
      columnDefs: [
        { responsivePriority: 1, targets: 0 }, // Sr. No.
        { responsivePriority: 2, targets: 2 }, // Business Name
        { responsivePriority: 3, targets: -1 }, // Actions (never hide)
        { className: 'text-nowrap', targets: -1 }, // Actions column nowrap
        { orderable: false, targets: 0 }, // Sr. No. not sortable
        { orderable: false, targets: -1 } // Actions column not sortable
      ],
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
      dom:
        '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
        '<"row"<"col-sm-12"tr>>' +
        '<"row mt-3"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
      initComplete: function () {
        $('.dataTables_filter input').addClass('form-control');
        $('.dataTables_length select').addClass('form-select form-select-sm');
      }
    });
  }

  const statusModalEl = document.getElementById('statusModal');
  const statusFormEl = document.getElementById('statusForm');
  if (statusModalEl && statusFormEl) {
    statusModalEl.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      const appId = trigger && trigger.getAttribute ? trigger.getAttribute('data-app-id') : null;
      const currentStatus = trigger && trigger.getAttribute ? trigger.getAttribute('data-current-status') : null;

      if (appId) {
        statusFormEl.action = `/admin/applications/${appId}/status`;
      }
      const statusSelect = document.getElementById('status');
      if (statusSelect && currentStatus) {
        statusSelect.value = currentStatus;
      }
    });
  }

  const deleteModalEl = document.getElementById('deleteModal');
  const deleteFormEl = document.getElementById('deleteForm');
  if (deleteModalEl && deleteFormEl) {
    deleteModalEl.addEventListener('show.bs.modal', function (event) {
      const trigger = event.relatedTarget;
      const appId = trigger && trigger.getAttribute ? trigger.getAttribute('data-app-id') : null;
      if (appId) {
        deleteFormEl.action = `/admin/applications/${appId}/delete`;
      }
    });
  }
});
