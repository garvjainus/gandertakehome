'use client';

import React from 'react';
import { DocComplianceStatus } from '@/types';
import { 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Plane,
  Shield,
  FileText
} from 'lucide-react';

interface ComplianceDashboardProps {
  complianceStatus: DocComplianceStatus[];
  onRefresh: () => void;
}

export function ComplianceDashboard({ complianceStatus, onRefresh }: ComplianceDashboardProps) {
  
  const getStatusColor = (status: DocComplianceStatus['overall_status']): string => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'non_compliant':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: DocComplianceStatus['overall_status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'non_compliant':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatStatusText = (status: DocComplianceStatus['overall_status']): string => {
    switch (status) {
      case 'compliant':
        return 'Compliant';
      case 'warning':
        return 'Needs Attention';
      case 'non_compliant':
        return 'Non-Compliant';
      default:
        return 'Unknown';
    }
  };

  // Separate pilots and aircraft
  const pilots = complianceStatus.filter(item => item.entity_type === 'pilot');
  const aircraft = complianceStatus.filter(item => item.entity_type === 'aircraft');

  // Calculate summary stats
  const totalEntities = complianceStatus.length;
  const compliantEntities = complianceStatus.filter(item => item.overall_status === 'compliant').length;
  const warningEntities = complianceStatus.filter(item => item.overall_status === 'warning').length;
  const nonCompliantEntities = complianceStatus.filter(item => item.overall_status === 'non_compliant').length;
  const totalCriticalExpired = complianceStatus.reduce((sum, item) => sum + item.critical_expired, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Entities</p>
              <p className="text-2xl font-bold text-blue-900">{totalEntities}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Compliant</p>
              <p className="text-2xl font-bold text-green-900">{compliantEntities}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Need Attention</p>
              <p className="text-2xl font-bold text-amber-900">{warningEntities}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Non-Compliant</p>
              <p className="text-2xl font-bold text-red-900">{nonCompliantEntities}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Critical Alert */}
      {totalCriticalExpired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Critical Documents Expired</h3>
              <p className="text-sm text-red-700 mt-1">
                {totalCriticalExpired} critical document(s) have expired. Operations may be affected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Compliance Status by Entity</h3>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Pilots Section */}
      <div className="space-y-4">
        <div className="flex items-center">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Pilots ({pilots.length})</h4>
        </div>
        
        {pilots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pilot data available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pilots.map((pilot) => (
              <div
                key={pilot.entity_id}
                className={`p-4 rounded-lg border ${getStatusColor(pilot.overall_status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{pilot.entity_name}</h5>
                  {getStatusIcon(pilot.overall_status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{formatStatusText(pilot.overall_status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Documents:</span>
                    <span>{pilot.total_docs}</span>
                  </div>
                  {pilot.expired_docs > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Expired:</span>
                      <span>{pilot.expired_docs}</span>
                    </div>
                  )}
                  {pilot.expiring_soon_docs > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Expiring Soon:</span>
                      <span>{pilot.expiring_soon_docs}</span>
                    </div>
                  )}
                  {pilot.critical_expired > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span className="flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Critical Expired:
                      </span>
                      <span>{pilot.critical_expired}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aircraft Section */}
      <div className="space-y-4">
        <div className="flex items-center">
          <Plane className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Aircraft ({aircraft.length})</h4>
        </div>
        
        {aircraft.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No aircraft data available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aircraft.map((ac) => (
              <div
                key={ac.entity_id}
                className={`p-4 rounded-lg border ${getStatusColor(ac.overall_status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{ac.entity_name}</h5>
                  {getStatusIcon(ac.overall_status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{formatStatusText(ac.overall_status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Documents:</span>
                    <span>{ac.total_docs}</span>
                  </div>
                  {ac.expired_docs > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Expired:</span>
                      <span>{ac.expired_docs}</span>
                    </div>
                  )}
                  {ac.expiring_soon_docs > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Expiring Soon:</span>
                      <span>{ac.expiring_soon_docs}</span>
                    </div>
                  )}
                  {ac.critical_expired > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span className="flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Critical Expired:
                      </span>
                      <span>{ac.critical_expired}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 