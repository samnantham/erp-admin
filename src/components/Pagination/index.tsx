import { Button, Flex, IconButton } from '@chakra-ui/react';
import { HiChevronLeft } from 'react-icons/hi';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  const startPage = currentPage - 2 > 0 ? currentPage - 2 : 1;
  const endPage = startPage + 4 < totalPages ? startPage + 4 : totalPages;

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, idx) => startPage + idx
  );

  return (
    <Flex alignItems="center" justifyContent="center" display={totalPages > 1 ? '' : 'none'}>
      <IconButton
        aria-label="Previous"
        icon={<HiChevronLeft />}
        size={'sm'}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />

      {pages.map((page) => (
        <Button
          key={page}
          size={'sm'}
          onClick={() => onPageChange(page)}
          mx="1"
          colorScheme={page === currentPage ? 'brand' : 'gray'}
        >
          {page}
        </Button>
      ))}

      <IconButton
        aria-label="Next"
        icon={<HiChevronLeft />}
        size={'sm'}
        transform="rotate(180deg)"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    </Flex>
  );
};

export default Pagination;
