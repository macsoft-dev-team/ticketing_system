import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search,
    X,
    Loader2,
    List,
    ScanLine
} from 'lucide-react';
import { Button } from '../ui/button';
import Input from '../ui/input';
import { Badge } from '../ui/badge';

const TicketSearchComponent = ({
    searchKeyword,
    setSearchKeyword,
    handleSearch,
    searching,
    ticketsList,
    showTicketsList,
    setShowTicketsList,
    handleSelectTicket,
    isScanning,
    setIsScanning,
    startBarcodeScanning,
    stopBarcodeScanning,
    listVideoInputDevices
}) => {
    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-center">
                <div className="flex-1">
                    <Input
                        placeholder="Type 2+ characters to search (Controller No, Ticket Code, IMEI...)"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <Button
                    onClick={() => {
                        if (isScanning) {
                            stopBarcodeScanning();
                            setIsScanning(false);
                        } else {
                            listVideoInputDevices().then(() => {
                                setIsScanning(true);
                                setTimeout(() => startBarcodeScanning(), 300);
                            });
                        }
                    }}
                    variant={isScanning ? "destructive" : "outline"}
                    className="gap-1 px-3"
                    size="medium"
                >
                    <ScanLine className="w-4 h-4" />
                    {isScanning ? 'Stop' : 'Scan'}
                </Button>

                <Button
                    onClick={handleSearch}
                    disabled={searching || !searchKeyword.trim()}
                    className="gap-2"
                >
                    {searching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    {searching ? 'Searching...' : 'Search'}
                </Button>
            </div>

            {/* Ticket Search Results List */}
            <AnimatePresence>
                {showTicketsList && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto"
                    >
                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-sm">
                                    Search Results ({ticketsList.length})
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTicketsList(false)}
                                className="p-1 h-6 w-6"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        {searching ? (
                            <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching tickets...
                            </div>
                        ) : ticketsList.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No tickets found matching your search
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {ticketsList.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleSelectTicket(ticket)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {ticket.ticketCode}
                                                </div>
                                                <div className="text-xs text-gray-600 truncate">
                                                    Controller: {ticket.controllerNumber || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-600 truncate">
                                                    IMEI: {ticket.imei || 'N/A'}
                                                </div>
                                                {ticket.currentMilestone && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge 
                                                            variant={ticket.currentMilestone.stage === 'SENT_TO_SERVICE_CENTER' ? 'secondary' : 'default'}
                                                            size="sm"
                                                        >
                                                            {ticket.currentMilestone.stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                Click to select
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TicketSearchComponent;