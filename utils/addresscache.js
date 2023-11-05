const NodeGeocoder = require('node-geocoder');
const LocationModel = require('../model/GpsLocation/LocationModel');

// const { logger } = require('./customlog');

class AddressCache {
    constructor() {
        this.geocoder = NodeGeocoder({ provider: 'openstreetmap' });
    }

    async findAddress(lat, lon) {
        try {
            const cachedLocation = await LocationModel.findOne({
                geo: { $near: [lat, lon], $maxDistance: 0.015 },
            });
            if (cachedLocation) return cachedLocation.address;
            const addresses = await this.geocoder.reverse({ lat, lon });
            if (addresses.length) {
                const newLocation = new LocationModel({
                    geo: [lat, lon],
                    address: addresses[0].formattedAddress.toString(),
                });
                newLocation.save();
                return newLocation.address;
            }
        } catch (e) {
            // logger.error(e);
            console.log(error)
        }
        return null;
    }
}

module.exports = { AddressCache };
