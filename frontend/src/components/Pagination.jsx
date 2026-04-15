/**
 * Reusable pagination component.
 */
export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="pagination">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="page-info">
        Page {page} of {totalPages} ({total} results)
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
