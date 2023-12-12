let express = require('express');
let router = express.Router();

const {
  getCarMaintenanceRecords,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  createAppointment,
  getCars,
  getCar,
  updateCar,
  deletecar,
} = require('../db/dbConnector_Sqlite.js');

/* GET home page. */
routes/index.js

// Render the edit interface for an appointment
router.get('/', async function(req, res) {
  try {
    const appointments = await getCarMaintenanceRecords(); // 这个函数应该已经被改写为使用 MongoDB
    console.log('route / called  -  appointments.length', appointments.length);
    console.log(appointments);
    res.render('index', { appointments, err: null, type: 'success' });
  } catch (exception) {
    console.error('Error executing mongodb query', exception);
    res.render('index', {
      appointments: [],
      err: `Error executing MongoDB query: ${exception}`,
      type: 'danger',
    });
  }
});


router.get('/cars/:CarID/edit', async function(req, res) {

  try {
    console.log(req.params.CarID);
    const car = await getCar(req.params.CarID);
    console.log(car);
    if (car) {
      res.render('cars_edit', { car, err: null, type: 'success' });
    } else {
      res.render('error', { message: 'car not found.', type: 'danger' });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('error', { message: `Error executing SQL ${exception}`, type: 'danger' });
  }
});

// Actually update the appointment
router.post('/appointments/:appointmentID/edit', async function(req, res) {
  console.log("Edit route", req.params.ride_id, req.body);
  const appointmentID = req.params.appointmentID;
  const updatedAppointment = req.body;

  try {
    const result = await updateAppointment(appointmentID, updatedAppointment);
    const appointment = await getAppointment(appointmentID);
    if (result.changes == 1) {
      res.render("appointments_edit", {
        appointment,
        err: "appointment modified",
        type: "success",
      });
    } else {
      res.render("ppointments_edit", {
        appointment,
        err: "Error updating the appointmentID = " + appointmentID,
        type: "danger",
      });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('appointments_edit', {
      appointment: null,
      err: `Error executing SQL ${exception}`,
      type: "danger"
    });
  }
});

router.post('/cars/:carID/edit', async function(req, res) {
  console.log("Edit route", req.params.carID, req.body);
  const carID = req.params.carID;
  const updatedcar = req.body;
  console.log("Updated car data", updatedcar);
  try {
    console.log("Updated car data", updatedcar);
    const result = await updateCar(carID, updatedcar);
    const car = await getCar(carID);
    if (result.changes == 1) {
      res.render("cars_edit", {
        car,
        err: "car modified",
        type: "success",
      });
    } else {
      res.render("cars_edit", {
        car,
        err: "Error updating the appointmentID = " + carID,
        type: "danger",
      });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('appointments_edit', {
      car: null,
      err: `Error executing SQL ${exception}`,
      type: "danger"
    });
  }
});

// Render the delete interface for an appointment
router.get('/appointments/:appointmentID/delete', async function(req, res) {
  const appointmentID = req.params.appointmentID;

  try {
    const result = await deleteAppointment(appointmentID);
    if (result.changes >= 1) {
      res.redirect('/');
    } else {
      res.render('error', { message: 'Error deleting the appointment.', type: 'danger' });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('error', { message: `Error executing SQL ${exception}`, type: 'danger' });
  }
});

router.get('/cars/:carID/delete', async function(req, res) {
  const carID = req.params.carID;

  try {
    const result = await deletecar(carID);
    if (result.changes >= 1) {
      res.redirect('/cars');
    } else {
      res.render('error', { message: 'Error deleting the car.', type: 'danger' });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('error', { message: `Error executing SQL ${exception}`, type: 'danger' });
  }
});

// Render the create interface for an appointment
router.get('/appointments/create', function(req, res) {
  res.render('appointments_create', { err: null, type: 'success' });
});

// Actually create the appointment
router.post('/appointments/create', async function(req, res) {
  const newAppointment = req.body; 
  try {
    
    const appointmentID = await createAppointment(newAppointment);
    if (appointmentID) {
      res.redirect('/?msg=Appointment+Created');
    } else {
      res.render('appointments_create', {
        err: "Error creating the appointment",
        type: "danger"
      });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('appointments_create', {
      err: "Error executing SQL " + exception,
      type: "danger"
    });
  }
});

router.get('/cars', async function(req, res) {
  try {
    const cars = await getCars();
    res.render('see_cars', { cars, err: null, type: 'success' });
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('index', {
      appointments: [],
      err: `Error executing SQL ${exception}`,
      type: 'danger',
    });
  }
});

module.exports = router;