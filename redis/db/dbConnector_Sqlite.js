const redis = require('redis');
const redisClient = redis.createClient({
    url: 'redis://localhost:6379' // 根据你的实际 Redis 服务器配置进行调整
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// 监听 connect 事件
redisClient.on('connect', () => {
    console.log('Successfully connected to Redis');
});

redisClient.connect();

module.exports = redisClient;



async function getCarMaintenanceRecords() {
  try {
    const keys = await redisClient.keys('appointment:*');
    const appointments = [];
    for (const key of keys) {
      const appointment = await redisClient.hGetAll(key);
      appointments.push(appointment);
    }
    return appointments;
  } catch (err) {
    console.error('Error retrieving all appointments:', err);
  }
}



async function getCars() {
  const db = await connect();
  try {
    const records = await db.collection('Cars').find({},
      {
        projection: {
          _id: 0, 
          CarID: 1, 
          OwnerID: 1,
          Model: 1,
          Year: 1
        }
      }).toArray();

    console.log("dbConnector got data", records.length);

    return records;
  } finally {
    
  }
}


async function getCar(CarID) {
  const db = await connect();
  try {
    const car = await db.collection('Cars').findOne({ "_id": CarID }, 
      { projection: { _id: 0, CarID: 1, OwnerID: 1, Model: 1, Year: 1 } });

    return car;
  } finally {
  }
}


async function getAppointment(appointmentID) {
  try {
    // 使用 HGETALL 命令从 Redis 获取特定预约的所有字段和值
    const appointment = await redisClient.hGetAll(`appointment:${appointmentID}`);

    // 如果需要，对数据进行适当的转换或处理
    // 例如，如果某些值是 JSON 字符串，可能需要解析它们
    // 如果预约不存在，appointment 将是一个空对象

    return appointment;
  } catch (err) {
    console.error('Error retrieving appointment from Redis:', err);
    throw err; // 或根据你的应用逻辑进行错误处理
  }
}



async function generateUniqueAppointmentID() {
  try {
    // 获取当前数据库中最大的appointmentID
    const keys = await redisClient.keys('appointment:*');
    let maxAppointmentID = 0;

    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length === 2) {
        const appointmentID = parseInt(parts[1], 10);
        if (!isNaN(appointmentID) && appointmentID > maxAppointmentID) {
          maxAppointmentID = appointmentID;
        }
      }
    }

    // 计算下一个唯一的appointmentID
    const nextAppointmentID = maxAppointmentID + 1;

    return nextAppointmentID.toString();
  } catch (err) {
    console.error('Error generating unique appointmentID:', err);
    throw err; // 抛出异常以指示失败
  }
}

async function createAppointment(appointmentData) {
  try {
    // 生成一个唯一的预约ID
    const appointmentID = await generateUniqueAppointmentID();

    // 构建 Redis 键
    const redisKey = `appointment:${appointmentID}`;

    // 为每个属性分配相应的值
    const hashData = {};
    hashData['year'] = appointmentData.Year || ''; // 使用默认值，如果未提供则为空字符串
    hashData['model'] = appointmentData.Model || '';
    hashData['carId'] = appointmentData.CarID || '';
    hashData['ID'] = appointmentID; // 将ID属性设置为生成的appointmentID

    // 将用户输入的数据存储为哈希
    await redisClient.hSet(redisKey, hashData);

    // 返回新创建的预约ID
    return appointmentID;
  } catch (err) {
    console.error('Error creating appointment:', err);
    throw err; // 抛出异常以指示失败
  }
}




async function updateAppointment(appointmentID, appointmentData) {
  try {
    const redisKey = `appointment:${appointmentID}`;
    const updateData = {};
    if (appointmentData.CarID !== undefined) updateData.carId = appointmentData.CarID;
    if (appointmentData.Year !== undefined) updateData.year = appointmentData.Year;
    if (appointmentData.Model !== undefined) updateData.model = appointmentData.Model;
    // 添加更多字段...

    const exists = await redisClient.exists(redisKey);
    if (!exists) {
      throw new Error('Appointment not found');
    }

    // 使用对象更新 Redis 哈希
    await redisClient.hSet(redisKey, updateData);

    // 简化返回值，表示更新成功
    return true;
  } catch (err) {
    console.error('Error updating appointment:', err);
    throw err; // 抛出异常以指示失败
  }
}







async function updateCar(carID, carData) {
  const db = await connect();
  try {
    // 假设 carID 对应的是 MongoDB 的 ObjectId，需要先将其转换为 ObjectId 类型
    // 如果 carID 已经是 ObjectId 类型，则不需要转换
    const oid = MongoClient.ObjectID(carID);

    const result = await db.collection('Cars').updateOne(
      { "_id": oid },
      {
        $set: {
          OwnerID: carData.OwnerID,
          Year: carData.Year,
          Model: carData.Model
        }
      }
    );

    // 返回更新操作的结果
    return result;
  } catch (error) {
    console.error('Error during updateCar:', error);
    throw error;
  } finally {
    // 在 MongoDB 中，通常不需要手动关闭数据库连接
  }
}




async function deleteAppointment(appointmentID) {
  try {
    const redisKey = `appointment:${appointmentID}`;

    const exists = await redisClient.exists(redisKey);
    if (!exists) {
      throw new Error('Appointment not found');
    }

    await redisClient.del(redisKey);

    // 返回 true 表示删除成功
    return true;
  } catch (err) {
    console.error('Error deleting appointment:', err);
    throw err; // 抛出异常以指示失败
  }
}


async function deletecar(carID) {
  const db = await connect();
  try {
    // 假设 carID 对应的是 MongoDB 的 ObjectId，需要先将其转换为 ObjectId 类型
    // 如果 carID 已经是 ObjectId 类型，则不需要转换
    const oid = MongoClient.ObjectID(carID);

    // 删除 Cars 集合中的文档
    const carResult = await db.collection('Cars').deleteOne({ "_id": oid });

    // 删除 Appointments 集合中的相关文档
    const appointmentResult = await db.collection('Appointments').deleteMany({ "CarID": oid });

    // 删除 Car_Maintenance 集合中的相关文档
    const maintenanceResult = await db.collection('Car_Maintenance').deleteMany({ "CarID": oid });

    // 返回 Cars 删除操作的结果
    return carResult;
  } finally {
    // 在 MongoDB 中，通常不需要手动关闭数据库连接
  }
}


module.exports = {
  getCarMaintenanceRecords,
  getAppointment,
  createAppointment,
  updateAppointment,
  getCars,
  getCar,
  updateCar,
  deletecar,
  deleteAppointment,
  generateUniqueAppointmentID
};

