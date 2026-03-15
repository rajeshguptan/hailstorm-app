// Simple test to verify the filtering logic
let collections = [
    {id: '1', name: 'Collection 1'},
    {id: '2', name: 'Collection 2'},
    {id: '3', name: 'Collection 3'}
];

console.log('Initial collections:', collections);

function deleteItem(type, id) {
    console.log('deleteItem called with:', type, id);
    if (!id || !type) return;

    if (type === 'collection') {
        console.log('Filtering collections, current length:', collections.length);
        collections = collections.filter(c => c.id !== id);
        console.log('After filter, new length:', collections.length);
        console.log('Remaining collections:', collections);
    }
}

// Test deleting collection with id '2'
deleteItem('collection', '2');

console.log('Final collections:', collections);