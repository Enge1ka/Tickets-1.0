const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: You must be logged in.' });
};

const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.status(401).json({ message: 'Unauthorized: You must be logged in.' });
        }

        if (roles.includes(req.session.user.role)) {
            return next();
        }

        res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    };
};

module.exports = {
    isAuthenticated,
    hasRole,
};
