import { Contact } from './types';

export const MOCK_CONTACTS: Contact[] = [
    {
        id: '1',
        name: 'Jane Doe',
        phone: '555-123-4567',
        email: 'jane.doe@example.com',
        status: 'online',
        details: 'Met at the tech conference. Interested in our new API.',
        phoneUrl: 'tel:5551234567',
        emailUrl: 'mailto:jane.doe@example.com',
    },
    {
        id: '2',
        name: 'John Smith',
        phone: '555-987-6543',
        email: 'john.smith@workplace.com',
        status: 'offline',
        details: 'Project lead for the Q3 initiative. Follow up next week.',
        phoneUrl: 'tel:5559876543',
        emailUrl: 'mailto:john.smith@workplace.com',
    },
    {
        id: '3',
        name: 'Alex Johnson',
        phone: '555-555-1212',
        status: 'offline',
        details: 'Graphic designer.',
        phoneUrl: 'tel:5555551212',
    },
    {
        id: '4',
        name: 'Emily White',
        email: 'emily.w@university.edu',
        status: 'online',
        details: 'University research partner.',
        emailUrl: 'mailto:emily.w@university.edu',
    },
];
