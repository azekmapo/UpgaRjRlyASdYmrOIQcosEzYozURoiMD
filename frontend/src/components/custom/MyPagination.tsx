import type { MyPaginationProps } from "@/types/pagination";

export default function MyPagination({ currentPage, totalPages, onPageChange }: MyPaginationProps) {
  const scrollToTop = () => {
    const mainContent = document.querySelector('.colPricipale');
         
    if (mainContent) {
      mainContent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    scrollToTop();
  };
     
  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    pages.push(
      <button 
        key={1}
        onClick={() => handlePageChange(1)}
        className={`py-2 px-3 border border-gray-300 bg-white text-gray-800 cursor-pointer rounded text-sm min-w-[40px] transition-all duration-200 hover:enabled:bg-gray-100 hover:enabled:border-gray-400 ${currentPage === 1 ? '!bg-[#11122c] !text-white !border-[#11122c] hover:-[#11122c]' : ''}`}
      >
        1
      </button>
    );

    if (showEllipsisStart) {
      pages.push(
        <span key="ellipsis-start" className="py-2 px-1 text-gray-500 text-sm">...</span>
      );
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button 
          key={i}
          onClick={() => handlePageChange(i)}
          className={`py-2 px-3 border border-gray-300 bg-white text-gray-800 cursor-pointer rounded text-sm min-w-[40px] transition-all duration-200 hover:enabled:bg-gray-100 hover:enabled:border-gray-400 ${currentPage === i ? '!bg-[#11122c] !text-white !border-[#11122c] hover:!text-white' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (showEllipsisEnd) {
      pages.push(
        <span key="ellipsis-end" className="py-2 px-1 text-gray-500 text-sm">...</span>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <button 
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`py-2 px-3 border border-gray-300 bg-white text-gray-800 cursor-pointer rounded text-sm min-w-[40px] transition-all duration-200 hover:enabled:bg-gray-100 hover:enabled:border-gray-400 ${currentPage === totalPages ? '!bg-[#11122c] !text-white !border-[#11122c] hover:!text-white' : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 my-5 flex-wrap">
      {renderPageNumbers()}
    </div>
  );
}