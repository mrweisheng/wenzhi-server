import { Request, Response } from 'express'
import pool from '../config/db'

// 创建客服订单
export const createCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { 
      order_id,
      date,
      is_fixed,
      order_content,
      word_count,
      fee,
      writer_id,
      exchange_time,
      payment_channel,
      store_name,
      new_customer,
      customer_name,
      order_amount,
      refund_amount,
      special_situation
    } = req.body;
    
    const userId = (req as any).userId;

    // 检查当前用户是否是客服角色
    const [userRole]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    // 只允许客服角色创建订单
    if (userRole.length === 0 || !userRole[0].role_name.includes('客服')) {
      return res.status(403).json({
        code: 1,
        message: '非客服角色无权创建订单'
      });
    }

    // 检查必填字段
    if (!writer_id) {
      return res.status(400).json({
        code: 1,
        message: '写手ID为必填项'
      });
    }

    // 检查订单号是否已存在
    const [existingOrder]: any = await pool.query(
      'SELECT order_id FROM customer_orders WHERE order_id = ?',
      [order_id]
    );

    if (existingOrder.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '订单号已存在'
      });
    }

    // 检查写手是否存在
    const [writer]: any = await pool.query(
      'SELECT id FROM writer_info WHERE id = ?',
      [writer_id]
    );

    if (writer.length === 0) {
      return res.status(400).json({
        code: 1,
        message: '指定的写手不存在'
      });
    }

    // 创建订单，自动设置客服ID为当前用户ID
    const [result]: any = await pool.query(
      'INSERT INTO customer_orders SET ?',
      {
        order_id,
        date,
        is_fixed,
        order_content,
        word_count,
        fee,
        customer_id: userId, // 强制设置为当前登录的客服ID
        writer_id,
        exchange_time,
        payment_channel,
        store_name,
        new_customer,
        customer_name,
        order_amount,
        refund_amount,
        special_situation
      }
    );

    // 查找系统订单表中是否存在匹配的订单
    const [systemOrder]: any = await pool.query(
      'SELECT order_id FROM orders WHERE order_id = ?',
      [order_id]
    );

    // 如果在系统订单表中找到匹配的订单，则更新该订单的客服和写手信息
    if (systemOrder.length > 0) {
      await pool.query(
        'UPDATE orders SET customer_id = ?, writer_id = ? WHERE order_id = ?',
        [userId, writer_id, order_id]
      );
    }

    res.json({
      code: 0,
      message: '创建成功',
      data: {
        id: result.insertId,
        order_id
      }
    });
  } catch (err: any) {
    console.error('Create customer order error:', err);
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    });
  }
}

// 获取客服订单列表
export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      order_id,
      date_start,
      date_end,
      customer_id,
      writer_id,
      is_fixed
    } = req.query;

    const userId = (req as any).userId;

    // 获取当前用户角色信息
    const [userRole]: any = await pool.query(
      `SELECT r.role_name 
       FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    // 判断用户是否是客服角色
    const isCustomerService = userRole.length > 0 && userRole[0].role_name.includes('客服');

    // 构建查询条件
    let sql = `
      SELECT co.*, 
             u.username as customer_service_name, 
             w.name as writer_name 
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      LEFT JOIN writer_info w ON co.writer_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // 如果是客服角色，只查询自己的订单
    if (isCustomerService) {
      sql += ' AND co.customer_id = ?';
      params.push(userId);
    }

    // 其他查询条件
    if (order_id) {
      sql += ' AND co.order_id = ?';
      params.push(order_id);
    }
    if (date_start) {
      sql += ' AND co.date >= ?';
      params.push(date_start);
    }
    if (date_end) {
      sql += ' AND co.date <= ?';
      params.push(date_end);
    }
    if (customer_id && !isCustomerService) { // 如果是客服角色，忽略customer_id参数
      sql += ' AND co.customer_id = ?';
      params.push(customer_id);
    }
    if (writer_id) {
      sql += ' AND co.writer_id = ?';
      params.push(writer_id);
    }
    if (is_fixed !== undefined) {
      sql += ' AND co.is_fixed = ?';
      params.push(is_fixed);
    }

    // 计算总数
    const [countResult]: any = await pool.query(
      `SELECT COUNT(*) as total FROM (${sql}) as t`,
      params
    );
    const total = countResult[0].total;

    // 分页查询
    sql += ' ORDER BY co.date DESC, co.id DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

    const [rows] = await pool.query(sql, params);

    res.json({
      code: 0,
      data: {
        total,
        list: rows
      },
      message: "获取成功"
    });
  } catch (err: any) {
    console.error('Get customer orders error:', err);
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    });
  }
}

// 通过ID查询客户订单
export const getCustomerOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const [orders]: any = await pool.query(
      `SELECT co.*, 
        CONCAT(u.first_name, ' ', u.last_name) as customer_service_name
      FROM customer_orders co
      LEFT JOIN users u ON co.customer_id = u.id
      WHERE co.id = ?`,
      [id]
    )

    if (orders.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '订单不存在'
      })
    }

    res.json({
      code: 0,
      data: orders[0]
    })
  } catch (error) {
    console.error('Get customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 更新客服订单
export const updateCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // 更新订单
    await pool.query(
      'UPDATE customer_orders SET ? WHERE id = ?',
      [updateData, id]
    )

    res.json({
      code: 0,
      message: '更新成功'
    })
  } catch (error) {
    console.error('Update customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
}

// 删除客服订单
export const deleteCustomerOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 删除订单
    await pool.query(
      'DELETE FROM customer_orders WHERE id = ?',
      [id]
    )

    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    console.error('Delete customer order error:', error)
    res.status(500).json({
      code: 1,
      message: '服务器错误'
    })
  }
} 