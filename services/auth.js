const sessionIdToMapUser = new Map();

function setUser(id, user) {
   return sessionIdToMapUser.set(id, user);
}
function getUser(id) {
    return sessionIdToMapUser.get(id);
}

export {
    setUser,
    getUser
};