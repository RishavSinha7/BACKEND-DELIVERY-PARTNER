const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Bike model
class Bike {
  static async findAll() {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async create(bikeData) {
    const { data, error } = await supabaseAdmin
      .from('bikes')
      .insert(bikeData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('bikes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('bikes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

// Truck model
class Truck {
  static async findAll() {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async create(truckData) {
    const { data, error } = await supabaseAdmin
      .from('trucks')
      .insert(truckData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('trucks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('trucks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}

// Driver model
class Driver {
  static async findAll() {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async findByProfileId(profileId) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('profile_id', profileId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async create(driverData) {
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .insert(driverData)
      .select(`
        *,
        profile:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        profile:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async updateLocation(id, latitude, longitude) {
    const { data, error } = await supabaseAdmin
      .rpc('update_driver_location', {
        p_driver_id: id,
        p_latitude: latitude,
        p_longitude: longitude
      });
    
    if (error) throw error;
    return data;
  }
  
  static async getAvailableDrivers(vehicleType) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('vehicle_type', vehicleType)
      .eq('current_status', 'available')
      .order('last_location_update', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

// BikeBooking model
class BikeBooking {
  static async findAll(customerId = null) {
    let query = supabase
      .from('bike_bookings')
      .select(`
        *,
        bike:bikes(*),
        customer:profiles(*)
      `)
      .order('created_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('bike_bookings')
      .select(`
        *,
        bike:bikes(*),
        customer:profiles(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async create(bookingData) {
    const { data, error } = await supabaseAdmin
      .from('bike_bookings')
      .insert(bookingData)
      .select(`
        *,
        bike:bikes(*),
        customer:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('bike_bookings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        bike:bikes(*),
        customer:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async assignToDriver(bookingId, driverId) {
    const { data, error } = await supabaseAdmin
      .rpc('assign_booking_to_driver', {
        p_booking_type: 'bike',
        p_booking_id: bookingId,
        p_driver_id: driverId
      });
    
    if (error) throw error;
    return data;
  }
}

// TruckBooking model
class TruckBooking {
  static async findAll(customerId = null) {
    let query = supabase
      .from('truck_bookings')
      .select(`
        *,
        truck:trucks(*),
        customer:profiles(*)
      `)
      .order('created_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('truck_bookings')
      .select(`
        *,
        truck:trucks(*),
        customer:profiles(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async create(bookingData) {
    const { data, error } = await supabaseAdmin
      .from('truck_bookings')
      .insert(bookingData)
      .select(`
        *,
        truck:trucks(*),
        customer:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('truck_bookings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        truck:trucks(*),
        customer:profiles(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async assignToDriver(bookingId, driverId) {
    const { data, error } = await supabaseAdmin
      .rpc('assign_booking_to_driver', {
        p_booking_type: 'truck',
        p_booking_id: bookingId,
        p_driver_id: driverId
      });
    
    if (error) throw error;
    return data;
  }
}

// DriverAssignment model
class DriverAssignment {
  static async findByDriverId(driverId) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  static async findById(id) {
    const { data, error } = await supabase
      .from('driver_assignments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async verifyOtp(assignmentId, enteredOtp) {
    const { data, error } = await supabaseAdmin
      .rpc('verify_otp_and_pickup', {
        p_assignment_id: assignmentId,
        p_entered_otp: enteredOtp
      });
    
    if (error) throw error;
    return data;
  }
  
  static async markCompleted(id) {
    const { data, error } = await supabaseAdmin
      .from('driver_assignments')
      .update({ completion_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = {
  Bike,
  Truck,
  Driver,
  BikeBooking,
  TruckBooking,
  DriverAssignment,
  supabase,
  supabaseAdmin
};
