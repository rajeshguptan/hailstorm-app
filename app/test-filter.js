// Test the filter logic
let collections = [
  {id: 'coll1', name: 'Collection 1', items: []},
  {id: 'coll2', name: 'Collection 2', items: []},
  {id: 'coll3', name: 'Collection 3', items: []}
];

console.log('Before delete:', collections.map(c => c.id));

function deleteItem(type, id) {
  console.log('deleteItem called with:', type, id);
  if (!id || !type) return;

  if (type === 'collection') {
    console.log('Before filter:', collections.length);
    collections = collections.filter(c => c.id !== id);
    console.log('After filter:', collections.length);
    console.log('Remaining IDs:', collections.map(c => c.id));
  }
}

// Test deleting coll2
deleteItem('collection', 'coll2');