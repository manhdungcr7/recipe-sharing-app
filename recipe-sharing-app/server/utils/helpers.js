// This file contains helper functions for various operations.

const generateResponse = (status, message, data = null) => {
    return {
        status,
        message,
        data,
    };
};

const isEmpty = (value) => {
    return value === undefined || value === null || value === '';
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US');
};

const paginate = (array, page_size, page_number) => {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
};

module.exports = {
    generateResponse,
    isEmpty,
    formatDate,
    paginate,
};