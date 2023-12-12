let express = require('express');
let router = express.Router();

const {
  getCarMaintenanceRecords,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  createAppointment,
  getCars,
  generateUniqueAppointmentID
} = require('../db/dbConnector_Sqlite.js');

/* GET home page. */
router.get('/', async function(req, res) {
  try {
    // 调用 getCarMaintenanceRecords 并获取返回的数据
    const appointments = await getCarMaintenanceRecords();

    // 打印 appointments 数组的长度，以查看是否检索到数据
    console.log('route / called - appointments.length:', appointments.length);

    // 如果需要查看详细数据，可以取消注释以下行
    // console.log('Appointments data:', appointments);

    // 使用返回的数据渲染视图
    res.render('index', { appointments, err: null, type: 'success' });
  } catch (exception) {
    // 如果出现异常，打印错误信息
    console.log('Error executing sql', exception);

    // 渲染视图时传入空数组和错误信息
    res.render('index', {
      appointments: [],
      err: `Error executing SQL ${exception}`,
      type: 'danger',
    });
  }
});


// Render the edit interface for an appointment
router.get('/appointments/:appointmentID/edit', async function(req, res) {
  console.log('Edit route for appointment', req.params.appointmentID);

  try {
    const appointment = await getAppointment(req.params.appointmentID);
    console.log(appointment);
    if (appointment) {
      res.render('appointments_edit', { appointment, err: null, type: 'success' });
    } else {
      res.render('error', { message: 'Appointment not found.', type: 'danger' });
    }
  } catch (exception) {
    console.log('Error executing sql', exception);
    res.render('error', { message: `Error executing SQL ${exception}`, type: 'danger' });
  }
});



// Actually update the appointment
router.post('/appointments/:appointmentID/edit', async function(req, res) {
  const appointmentID = req.params.appointmentID;
  const updatedAppointment = req.body;

  try {
    await updateAppointment(appointmentID, updatedAppointment);
    const appointment = await getAppointment(appointmentID); // 确保这个函数存在

    // 更新成功，渲染成功信息
    res.render("appointments_edit", {
      appointment,
      err: "Appointment modified successfully",
      type: "success",
    });
  } catch (exception) {
    // 更新失败，渲染错误信息
    console.log('Error executing update', exception);
    res.render('appointments_edit', {
      appointment: null,
      err: `Error updating appointment: ${exception.message}`,
      type: "danger"
    });
  }
});



// Render the delete interface for an appointment
router.get('/appointments/:appointmentID/delete', async function(req, res) {
  const appointmentID = req.params.appointmentID;

  try {
    const success = await deleteAppointment(appointmentID);
    if (success) {
      res.redirect('/');
    } else {
      res.render('error', { message: 'Error deleting the appointment.', type: 'danger' });
    }
  } catch (exception) {
    console.log('Error executing delete operation', exception);
    res.render('error', { message: `Error deleting appointment: ${exception.message}`, type: 'danger' });
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
    // 创建新的预约
    const appointmentID = await createAppointment(newAppointment);
    
    // 如果预约成功创建，则重定向到首页
    if (appointmentID) {
      res.redirect('/?msg=Appointment+Created');
    } else {
      res.render('appointments_create', {
        err: "Error creating the appointment",
        type: "danger"
      });
    }
  } catch (exception) {
    console.error('Error creating appointment:', exception);
    res.render('appointments_create', {
      err: "Error creating the appointment: " + exception,
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