import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Home, 
    UserCircle, 
    Settings, 
    LogOut, 
    ChevronRight, 
    Menu, 
    Layers,
    User
} from 'lucide-react';
import { AiFillMedicineBox } from 'react-icons/ai';
import { MdSell } from 'react-icons/md';
import { FaCartPlus, FaFileInvoice } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';

const Authenticated = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const token = useSelector((state) => state.auth.token);

    let username = "User";
    let decodedToken = null;

    if (token) {
        try {
            decodedToken = jwtDecode(token);
            username = decodedToken?.name || "User";
        } catch (err) {
            console.error("Invalid token:", err.message);
        }
    }

    const menuItems = [
        { title: 'Dashboard', icon: Home, path: '/dashboard' },
        { title: 'Invoice', icon: FaFileInvoice, path: '/invoice' },
        { title: 'Stock', icon:  Layers, path: '/stock' },
        { title: 'Purchase', icon: FaCartPlus, path: '/purchase' },
        { title: 'Medicine', icon: AiFillMedicineBox, path: '/medicine' },
        { title: 'Supplier', icon: MdSell, path: '/supplier' },
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-teal-600 text-white h-16 fixed w-full top-0 z-50 px-4">
                <div className="flex items-center justify-between h-full">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-teal-700 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="ml-4 text-xl font-semibold">Wolego Transport</span>
                    </div>
                    <div className="relative">
                        <div
                            className="flex items-center cursor-pointer p-2 hover:bg-teal-700 rounded-lg"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <User size={24} className="rounded-full mr-2" />
                            <span className="mr-2">{username}</span>
                            <ChevronRight
                                size={20}
                                className={`transform transition-transform ${isProfileOpen ? 'rotate-90' : ''
                                    }`}
                            />
                        </div>
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 text-gray-700">
                                <button
                                    onClick={() => handleNavigation('/profile')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                                >
                                    <UserCircle size={16} className="mr-2" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => handleNavigation('/settings')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                                >
                                    <Settings size={16} className="mr-2" />
                                    Settings
                                </button>
                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600">
                                    <LogOut size={16} className="mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-16 h-screen bg-white shadow-lg z-40 transition-all ${isSidebarOpen ? 'w-60' : 'w-20'
                    }`}
            >
                <div className="py-4">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index}>
                                <button
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full px-4 py-3 flex items-center hover:bg-teal-50 text-gray-700 hover:text-teal-600 ${!isSidebarOpen ? 'justify-center' : ''
                                        } ${location.pathname === item.path
                                            ? 'bg-teal-50 text-teal-600'
                                            : ''
                                        }`}
                                >
                                    <Icon size={20} />
                                    {isSidebarOpen && <span className="ml-4">{item.title}</span>}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </aside>
            <main className={`pt-16 ${isSidebarOpen ? 'ml-60' : 'ml-20'} transition-all duration-300 p-6`}>
                {children}
            </main>
        </div>
    );
};

export default Authenticated;