export const paginated = (data, currentPage, size, totalElements) => {
    return{
        data: data,
        currentPage,
        size,
        totalElements,
        totalPages: Math.ceil(totalElements / size),
    }
}