const Hdb = require("../models/hdb_model");
const initializeHDBData = async () => {
    const existingData = await Hdb.findOne();
    if (!existingData) {
        const sampleHDBData = [
            {
                town: 'Bedok',
                estates: [
                    {
                        name: 'Bedok Bloom',
                        blocks: ['101A', '101B', '102A', '102B', '103A', '103B']
                    },
                    {
                        name: 'Bedok Central',
                        blocks: ['201A', '201B', '202A', '202B']
                    }
                ]
            },
            {
                town: 'Jurong West',
                estates: [
                    {
                        name: 'Jurong Spring',
                        blocks: ['301A', '301B', '302A', '302B', '303A']
                    },
                    {
                        name: 'Jurong Lake',
                        blocks: ['401A', '401B', '402A']
                    }
                ]
            },
            {
                town: 'Punggol',
                estates: [
                    {
                        name: 'Queen\'s Arc',
                        blocks: ['501A', '501B', '502A', '502B', '503A', '503B']
                    }
                ]
            }
        ];

        await Hdb.insertMany(sampleHDBData);
        console.log('HDB data initialized');
    }
};

module.exports = initializeHDBData;